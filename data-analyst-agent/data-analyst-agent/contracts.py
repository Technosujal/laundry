"""Fail-closed contracts for ATLAS model-generated analysis.

The model may propose calculations and explanations. These functions decide
whether a result is eligible to leave the system. Invalid, unbalanced, or
unverified output is rejected rather than repaired or guessed.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


class ContractError(ValueError):
    """Raised when evidence is incomplete or violates the release contract."""


@dataclass(frozen=True)
class ReleaseDecision:
    allowed: bool
    verified_result_ids: tuple[str, ...]
    reason: str


def _require_object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or value.get("_parse_error"):
        raise ContractError(f"{label} is not valid structured evidence.")
    return value


def validate_ingest(report: Any) -> dict[str, Any]:
    report = _require_object(report, "Ingest report")
    tables = report.get("tables")
    if not isinstance(tables, list) or not tables:
        raise ContractError("Ingest report contains no tables.")
    for table in tables:
        table = _require_object(table, "Ingest table")
        required = {
            "name", "source", "sha256_before", "sha256_after", "rows_read",
            "included", "quarantined", "silently_deleted", "row_ledger",
        }
        missing = sorted(required - table.keys())
        if missing:
            raise ContractError(f"Ingest table is missing: {', '.join(missing)}.")
        if table["sha256_before"] != table["sha256_after"]:
            raise ContractError(f"Source integrity failed for {table['name']}.")
        counts = (table["rows_read"], table["included"], table["quarantined"], table["silently_deleted"])
        if any(type(value) is not int or value < 0 for value in counts):
            raise ContractError(f"Row counts are invalid for {table['name']}.")
        if table["silently_deleted"] != 0:
            raise ContractError(f"Silent deletion was reported for {table['name']}.")
        if table["rows_read"] != table["included"] + table["quarantined"]:
            raise ContractError(f"Row accounting does not balance for {table['name']}.")
        if not isinstance(table["row_ledger"], str) or not table["row_ledger"].strip():
            raise ContractError(f"Row ledger is missing for {table['name']}.")
    return report


def validate_analysis(report: Any) -> dict[str, Any]:
    report = _require_object(report, "Analysis report")
    results = report.get("results")
    if not isinstance(results, list):
        raise ContractError("Analysis results must be a list.")
    if report.get("errors"):
        raise ContractError("Analysis contains unresolved execution errors.")
    seen: set[str] = set()
    for result in results:
        result = _require_object(result, "Analysis result")
        required = {"result_id", "name", "value", "calculation_id", "source_columns", "filters", "evidence"}
        missing = sorted(required - result.keys())
        if missing:
            raise ContractError(f"Analysis result is missing: {', '.join(missing)}.")
        result_id = result["result_id"]
        if not isinstance(result_id, str) or not result_id.strip() or result_id in seen:
            raise ContractError("Every result_id must be a unique, non-empty string.")
        seen.add(result_id)
        if not isinstance(result["source_columns"], list) or not result["source_columns"]:
            raise ContractError(f"Result {result_id} has no source-column lineage.")
        if not isinstance(result["evidence"], str) or not result["evidence"].strip():
            raise ContractError(f"Result {result_id} has no executed-output evidence.")
    return report


def release_decision(
    analysis: Any,
    verification: Any,
    successful_evidence_ids: set[str] | None = None,
    successful_verifier_evidence_ids: set[str] | None = None,
) -> ReleaseDecision:
    try:
        analysis = validate_analysis(analysis)
        verification = _require_object(verification, "Verification report")
    except ContractError as error:
        return ReleaseDecision(False, (), str(error))

    verdict = verification.get("verdict")
    if verdict not in {"PASS", "PASS_WITH_NOTES"}:
        return ReleaseDecision(False, (), "Independent verification did not pass.")
    recomputations = verification.get("recomputations")
    if not isinstance(recomputations, list):
        return ReleaseDecision(False, (), "Verification has no result-by-result recomputations.")

    matches: dict[str, bool] = {}
    for item in recomputations:
        if isinstance(item, dict) and isinstance(item.get("result_id"), str):
            if successful_verifier_evidence_ids is not None and item.get("evidence") not in successful_verifier_evidence_ids:
                continue
            matches[item["result_id"]] = item.get("match") is True
    expected = {item["result_id"] for item in analysis["results"]}
    if successful_evidence_ids is not None:
        unproven = {
            item["result_id"] for item in analysis["results"]
            if item["evidence"] not in successful_evidence_ids
        }
        if unproven:
            return ReleaseDecision(
                False, (), "Results do not reference successful executed evidence: " + ", ".join(sorted(unproven)) + "."
            )
    verified = tuple(sorted(result_id for result_id in expected if matches.get(result_id) is True))
    missing = expected - set(verified)
    if missing:
        return ReleaseDecision(False, verified, "Results lack independent matches: " + ", ".join(sorted(missing)) + ".")
    failed_checks = [item for item in verification.get("sanity_checks", []) if item.get("passed") is not True]
    if failed_checks:
        return ReleaseDecision(False, verified, "One or more sanity checks failed.")
    return ReleaseDecision(True, verified, "Every result passed independent recomputation and sanity checks.")


def verified_results(analysis: dict[str, Any], decision: ReleaseDecision) -> list[dict[str, Any]]:
    if not decision.allowed:
        return []
    allowed = set(decision.verified_result_ids)
    return [item for item in analysis["results"] if item["result_id"] in allowed]


def cannot_determine(reason: str) -> str:
    return (
        "## C. ANSWER\n\n"
        "Cannot determine a reliable answer from the available verified evidence.\n\n"
        "## E. VERIFICATION\n\n"
        f"The release gate stopped the result: {reason}\n\n"
        "## H. CONFIDENCE\n\nCANNOT DETERMINE"
    )
