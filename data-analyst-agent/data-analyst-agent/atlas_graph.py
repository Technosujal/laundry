"""
ATLAS — Data Analyst Coworker Agent (LangGraph + LangChain)

Pipeline:  ingest -> profile -> plan -> analyze -> verify -(FAIL, <=3x)-> analyze
                                                  -(PASS)-> explain -> END

Every number the agent reports must come from executed code. The Analyst and the
Verifier each get their own Python tool; the Verifier is forbidden from reusing
the Analyst's code and must reconcile every reported value independently.

Install:
    pip install -U langgraph langchain langchain-anthropic pandas numpy scipy statsmodels scikit-learn duckdb openpyxl pyarrow

Run:
    export ANTHROPIC_API_KEY=...
    python atlas_graph.py --data sales.csv --question "Which region had the highest revenue growth in Q2?"

Swap the model: any LangChain chat model with .bind_tools() works (ChatOpenAI, ChatOllama, ...).
"""

from __future__ import annotations

import argparse
import ast
import builtins
import io
import json
import contextlib
import hashlib
import traceback
from pathlib import Path
from typing import Any, Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import END, StateGraph

from contracts import cannot_determine, release_decision, verified_results

PROMPTS = Path(__file__).with_name("PROMPTS.md").read_text(encoding="utf-8")


# --------------------------------------------------------------------------- #
# 1. Prompt extraction (keeps PROMPTS.md as the single source of truth)
# --------------------------------------------------------------------------- #
def _section(marker: str) -> str:
    """Pull the ```text block that follows a heading in PROMPTS.md."""
    start = PROMPTS.index(marker)
    block_start = PROMPTS.index("```text", start) + len("```text")
    block_end = PROMPTS.index("```", block_start)
    return PROMPTS[block_start:block_end].strip()


MASTER_PROMPT = _section("## 1. MASTER SYSTEM PROMPT")
PREAMBLE = _section("### Shared preamble")
NODE_PROMPTS = {
    "ingest": _section("### 2.1 INGEST agent"),
    "profile": _section("### 2.2 PROFILER agent"),
    "plan": _section("### 2.3 PLANNER agent"),
    "analyze": _section("### 2.4 ANALYST agent"),
    "verify": _section("### 2.5 VERIFIER agent"),
    "explain": _section("### 2.6 EXPLAINER agent"),
}


# --------------------------------------------------------------------------- #
# 2. Tools — a persistent Python sandbox shared by the nodes that need data
# --------------------------------------------------------------------------- #
class PythonSession:
    """One namespace per graph run so the Analyst's DataFrames persist across tool calls.
    The Verifier gets a *separate* session so it cannot lean on the Analyst's variables."""

    FORBIDDEN_NAMES = {"open", "eval", "exec", "compile", "input", "__import__", "breakpoint"}
    FORBIDDEN_ATTRIBUTES = {
        "system", "popen", "unlink", "remove", "rmdir", "rename", "write_text", "write_bytes",
        "to_csv", "to_excel", "to_json", "to_parquet", "to_pickle", "to_sql",
        "read_csv", "read_excel", "read_json", "read_parquet", "read_pickle", "read_sql",
    }

    def __init__(self, allowed_paths: list[str] | None = None) -> None:
        import numpy as np
        import pandas as pd

        safe_builtins = {
            name: getattr(builtins, name) for name in (
                "abs", "all", "any", "bool", "dict", "enumerate", "float", "int", "len", "list",
                "max", "min", "print", "range", "round", "set", "sorted", "str", "sum", "tuple", "zip",
            )
        }
        self.ns: dict[str, Any] = {"pd": pd, "np": np, "json": json, "__builtins__": safe_builtins}
        self.execution_records: list[dict[str, Any]] = []
        self.allowed_paths = {str(Path(path).resolve()) for path in (allowed_paths or []) if "://" not in path}
        self.ns["load_table"] = self.load_table
        self.ns["pd"].set_option("display.width", 200)
        self.ns["pd"].set_option("display.max_columns", 50)

    def load_table(self, path: str, **options):
        """Read only a user-approved source path; return a fresh DataFrame."""
        resolved = str(Path(path).resolve())
        if resolved not in self.allowed_paths:
            raise PermissionError("Only paths explicitly supplied by the user may be loaded.")
        suffix = Path(resolved).suffix.lower()
        if suffix == ".csv":
            return self.ns["pd"].read_csv(resolved, **options).copy(deep=True)
        if suffix == ".tsv":
            return self.ns["pd"].read_csv(resolved, sep="\t", **options).copy(deep=True)
        if suffix in {".json", ".jsonl", ".ndjson"}:
            options.setdefault("lines", suffix in {".jsonl", ".ndjson"})
            return self.ns["pd"].read_json(resolved, **options).copy(deep=True)
        if suffix in {".xlsx", ".xls"}:
            return self.ns["pd"].read_excel(resolved, **options).copy(deep=True)
        if suffix == ".parquet":
            return self.ns["pd"].read_parquet(resolved, **options).copy(deep=True)
        raise ValueError(f"Unsupported analysis source: {suffix or 'no extension'}")

    def _validate(self, code: str) -> None:
        tree = ast.parse(code, mode="exec")
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)):
                raise PermissionError("Imports and global namespace mutation are not allowed in analysis code.")
            if isinstance(node, ast.Name) and (node.id.startswith("__") or node.id in self.FORBIDDEN_NAMES):
                raise PermissionError(f"Use of {node.id!r} is not allowed in analysis code.")
            if isinstance(node, ast.Attribute):
                if node.attr.startswith("__") or node.attr in self.FORBIDDEN_ATTRIBUTES:
                    raise PermissionError(f"Use of attribute {node.attr!r} is not allowed in analysis code.")

    def run(self, code: str) -> str:
        buf = io.StringIO()
        success = True
        try:
            self._validate(code)
            with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                exec(compile(code, "<atlas-analysis>", "exec"), self.ns)  # noqa: S102
        except Exception:  # pragma: no cover
            success = False
            buf.write(traceback.format_exc())
        out = buf.getvalue()
        out = out[-20000:] if out else "(no output - use print())"
        evidence_id = "exec-" + hashlib.sha256((code + "\n" + out).encode("utf-8")).hexdigest()[:20]
        self.execution_records.append({"evidence_id": evidence_id, "success": success})
        return f"EVIDENCE_ID: {evidence_id}\nSUCCESS: {str(success).lower()}\n{out}"

    @property
    def successful_evidence_ids(self) -> set[str]:
        return {record["evidence_id"] for record in self.execution_records if record["success"]}


def make_python_tool(session: PythonSession, name: str):
    @tool(name)
    def run_python(code: str) -> str:
        """Execute Python in a persistent pandas/numpy/scipy sandbox. Variables persist between calls.
        Always print() the values you intend to report."""
        return session.run(code)

    return run_python


# --------------------------------------------------------------------------- #
# 3. Graph state
# --------------------------------------------------------------------------- #
class AtlasState(TypedDict, total=False):
    data_paths: list[str]
    question: str
    ingest: dict
    profile: dict
    plan: dict
    analysis: dict
    verification: dict
    attempts: int
    final_answer: str
    history: list[dict]  # previous Q&A on the same data


MAX_VERIFY_RETRIES = 3


# --------------------------------------------------------------------------- #
# 4. Generic tool-calling loop for one micro-agent
# --------------------------------------------------------------------------- #
def run_agent(llm, system: str, user: str, tools: list, max_steps: int = 25) -> str:
    """Run a single micro-agent until it stops calling tools; return its final text."""
    bound = llm.bind_tools(tools) if tools else llm
    tool_map = {t.name: t for t in tools}
    messages: list[BaseMessage] = [SystemMessage(content=system), HumanMessage(content=user)]

    for _ in range(max_steps):
        ai: AIMessage = bound.invoke(messages)
        messages.append(ai)
        if not ai.tool_calls:
            return ai.content if isinstance(ai.content, str) else json.dumps(ai.content)
        for call in ai.tool_calls:
            result = tool_map[call["name"]].invoke(call["args"])
            messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    messages.append(HumanMessage(content="Step budget exhausted. Return your final JSON now."))
    ai = bound.invoke(messages)
    return ai.content if isinstance(ai.content, str) else json.dumps(ai.content)


def parse_json(text: str) -> dict:
    """Tolerate ```json fences and leading prose."""
    text = text.strip()
    if "```" in text:
        text = text.split("```json")[-1].split("```")[0] if "```json" in text else text.split("```")[1]
    start, end = text.find("{"), text.rfind("}")
    try:
        return json.loads(text[start : end + 1])
    except Exception:
        return {"_raw": text, "_parse_error": True}


def render_report(state: AtlasState, decision) -> str:
    """Render verified values in code so the language model cannot add numbers."""
    if not decision.allowed:
        return cannot_determine(decision.reason)
    results = verified_results(state["analysis"], decision)
    lines = [
        "## A. DATA OVERVIEW", "",
        "The source passed the recorded intake checks. See the profile and row ledger for data-quality details.", "",
        "## B. QUESTION AS UNDERSTOOD", "", state["question"], "",
        "## C. ANSWER", "",
    ]
    for result in results:
        unit = f" {result.get('unit', '')}".rstrip()
        lines.append(f"- {result['name']}: {result['value']}{unit} (result `{result['result_id']}`).")
    lines.extend(["", "## D. METHOD", ""])
    lines.append(str(state.get("plan", {}).get("method", {}).get("name", "Recorded in the analysis evidence.")))
    lines.extend(["", "## E. VERIFICATION", "", decision.reason])
    for check in state.get("verification", {}).get("sanity_checks", []):
        lines.append(f"- {check.get('check', 'Check')}: passed. {check.get('detail', '')}".rstrip())
    lines.extend(["", "## F. INTERPRETATION & CAVEATS", ""])
    limitations = state.get("plan", {}).get("limitations", [])
    lines.extend(f"- {item}" for item in limitations)
    if not limitations:
        lines.append("- Verification proves the calculation process, not that every source value reflects real-world truth.")
    lines.extend(["", "## G. CALCULATION LINEAGE", ""])
    for result in results:
        sources = ", ".join(map(str, result.get("source_columns", [])))
        lines.append(
            f"- `{result['result_id']}` / `{result['calculation_id']}` — sources: {sources}; "
            f"filters: {result.get('filters') or 'none recorded'}; evidence: {result['evidence']}"
        )
    lines.extend(["", "## H. CONFIDENCE", "", "VERIFIED_PROCESS"])
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# 5. Node factories
# --------------------------------------------------------------------------- #
def build_nodes(llm, analyst_session: PythonSession | None = None,
                verifier_session: PythonSession | None = None):
    analyst_session = analyst_session or PythonSession()
    verifier_session = verifier_session or PythonSession()
    analyst_py = make_python_tool(analyst_session, "run_python")
    verifier_py = make_python_tool(verifier_session, "run_python_verifier")

    def sys_prompt(node: str) -> str:
        return f"{PREAMBLE}\n\n{NODE_PROMPTS[node]}"

    def ingest(state: AtlasState) -> AtlasState:
        user = f"Files / sources to load:\n{json.dumps(state['data_paths'], indent=2)}\n" \
               "Load each into the sandbox as a pandas DataFrame named after the table. Return the JSON."
        return {"ingest": parse_json(run_agent(llm, sys_prompt("ingest"), user, [analyst_py]))}

    def profile(state: AtlasState) -> AtlasState:
        user = f"Ingest report:\n{json.dumps(state['ingest'], indent=2)}\n" \
               "The tables are already loaded in the sandbox. Profile every table and return the JSON."
        return {"profile": parse_json(run_agent(llm, sys_prompt("profile"), user, [analyst_py]))}

    def plan(state: AtlasState) -> AtlasState:
        feedback = ""
        if state.get("verification", {}).get("verdict") == "FAIL":
            feedback = f"\n\nPREVIOUS ATTEMPT FAILED VERIFICATION. Verifier issues:\n" \
                       f"{json.dumps(state['verification'].get('issues'), indent=2)}\nRevise the plan to fix them."
        user = (f"User question: {state['question']}\n\nData profile:\n{json.dumps(state['profile'], indent=2)}\n\n"
                f"Prior Q&A on this data (for context):\n{json.dumps(state.get('history', []), indent=2)}{feedback}")
        return {"plan": parse_json(run_agent(llm, sys_prompt("plan"), user, []))}

    def analyze(state: AtlasState) -> AtlasState:
        feedback = ""
        if state.get("verification", {}).get("verdict") == "FAIL":
            feedback = f"\n\nYOUR PREVIOUS RESULT FAILED VERIFICATION:\n{json.dumps(state['verification'], indent=2)}\nFix every issue."
        user = (f"Question: {state['question']}\n\nPlan:\n{json.dumps(state['plan'], indent=2)}\n\n"
                f"Profile summary:\n{json.dumps(state['profile'], indent=2)[:8000]}\n"
                "Tables are already loaded in the sandbox (see ingest report names). Execute and return the JSON."
                f"{feedback}")
        return {"analysis": parse_json(run_agent(llm, sys_prompt("analyze"), user, [analyst_py])),
                "attempts": state.get("attempts", 0) + 1}

    def verify(state: AtlasState) -> AtlasState:
        # Give the verifier a *fresh* sandbox: reload from source, not from the analyst's variables.
        user = (f"Question: {state['question']}\n\nPlan:\n{json.dumps(state['plan'], indent=2)}\n\n"
                f"Analyst results (audit these):\n{json.dumps(state['analysis'], indent=2)}\n\n"
                f"Sources to reload independently:\n{json.dumps(state['data_paths'])}\n"
                f"Load code used by ingest (you may reuse ONLY this loading code, not the analysis code):\n"
                f"{json.dumps([t.get('load_code') for t in state['ingest'].get('tables', [])], indent=2)}\n"
                "Recompute everything by a different route and return the JSON verdict.")
        return {"verification": parse_json(run_agent(llm, sys_prompt("verify"), user, [verifier_py]))}

    def explain(state: AtlasState) -> AtlasState:
        decision = release_decision(
            state.get("analysis"),
            state.get("verification"),
            analyst_session.successful_evidence_ids,
            verifier_session.successful_evidence_ids,
        )
        answer = render_report(state, decision)
        history = list(state.get("history", [])) + [{"question": state["question"], "answer_summary": answer[:1500]}]
        return {"final_answer": answer, "history": history}

    return ingest, profile, plan, analyze, verify, explain


def route_after_verify(state: AtlasState) -> Literal["explain", "analyze"]:
    verdict = state.get("verification", {}).get("verdict", "FAIL")
    if verdict in ("PASS", "PASS_WITH_NOTES") or state.get("attempts", 0) >= MAX_VERIFY_RETRIES:
        return "explain"
    return "analyze"


# --------------------------------------------------------------------------- #
# 6. Graph assembly
# --------------------------------------------------------------------------- #
def build_graph(llm, checkpointer=None, analyst_session=None, verifier_session=None):
    ingest, profile, plan, analyze, verify, explain = build_nodes(llm, analyst_session, verifier_session)
    g = StateGraph(AtlasState)
    g.add_node("ingest", ingest)
    g.add_node("profile", profile)
    g.add_node("plan", plan)
    g.add_node("analyze", analyze)
    g.add_node("verify", verify)
    g.add_node("explain", explain)

    g.set_entry_point("ingest")
    g.add_edge("ingest", "profile")
    g.add_edge("profile", "plan")
    g.add_edge("plan", "analyze")
    g.add_edge("analyze", "verify")
    g.add_conditional_edges("verify", route_after_verify, {"explain": "explain", "analyze": "analyze"})
    g.add_edge("explain", END)
    return g.compile(checkpointer=checkpointer)


def build_followup_graph(llm, checkpointer=None, analyst_session=None, verifier_session=None):
    """Same data, new question: skip ingest/profile and reuse cached state."""
    _, _, plan, analyze, verify, explain = build_nodes(llm, analyst_session, verifier_session)
    g = StateGraph(AtlasState)
    g.add_node("plan", plan)
    g.add_node("analyze", analyze)
    g.add_node("verify", verify)
    g.add_node("explain", explain)
    g.set_entry_point("plan")
    g.add_edge("plan", "analyze")
    g.add_edge("analyze", "verify")
    g.add_conditional_edges("verify", route_after_verify, {"explain": "explain", "analyze": "analyze"})
    g.add_edge("explain", END)
    return g.compile(checkpointer=checkpointer)


# --------------------------------------------------------------------------- #
# 7. CLI
# --------------------------------------------------------------------------- #
def main() -> None:
    ap = argparse.ArgumentParser(description="ATLAS data-analyst coworker")
    ap.add_argument("--data", nargs="+", required=True, help="file paths or SQLAlchemy URLs")
    ap.add_argument("--question", required=True)
    ap.add_argument("--model", default="claude-sonnet-4-5")
    args = ap.parse_args()

    from langchain_anthropic import ChatAnthropic
    from langgraph.checkpoint.memory import MemorySaver

    llm = ChatAnthropic(model=args.model, temperature=0, max_tokens=8000)
    analyst_session = PythonSession(args.data)
    verifier_session = PythonSession(args.data)
    app = build_graph(
        llm,
        checkpointer=MemorySaver(),
        analyst_session=analyst_session,
        verifier_session=verifier_session,
    )
    config = {"configurable": {"thread_id": "atlas-session-1"}}

    result = app.invoke({"data_paths": args.data, "question": args.question, "attempts": 0, "history": []}, config=config)
    print(result["final_answer"])

    # Interactive follow-ups on the same data
    follow = build_followup_graph(
        llm,
        checkpointer=MemorySaver(),
        analyst_session=analyst_session,
        verifier_session=verifier_session,
    )
    while True:
        try:
            q = input("\nFollow-up question (blank to exit): ").strip()
        except EOFError:
            break
        if not q:
            break
        result = follow.invoke({**result, "question": q, "attempts": 0, "verification": {}},
                               config={"configurable": {"thread_id": "atlas-followup"}})
        print(result["final_answer"])


if __name__ == "__main__":
    main()
