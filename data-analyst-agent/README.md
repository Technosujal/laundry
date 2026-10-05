# ATLAS Independent Data Analyst

ATLAS is a local, lossless data reader plus an optional model-driven analysis workflow. It accepts any file up to 1 GB and never discards an upload because its format is unfamiliar.

Content extraction is enabled for CSV, TSV, JSON, JSONL, NDJSON, TXT, LOG, Markdown, XML, HTML, DOCX, PDF, XLS/XLSX, and Parquet. Unknown binary formats receive a verified metadata-only profile without guessed content. PDF, Excel, and Parquet extraction require the packages in `requirements.txt`; the remaining readers use Python's standard library.

## Run the data reader

From `data-analyst-agent/data-analyst-agent`:

```powershell
pip install -r requirements-reader.txt
python web_app.py
```

Open `http://localhost:7070`, select a data file, and review the generated profile.

You can select multiple files, add folders repeatedly, or drag several folders onto the upload area. Files accumulate in a queue and are analyzed when you select **Analyze queued files**. After the batch completes, use the file selector above the results to inspect each file and its individual process log.

Each analysis is retained under `.atlas-work/<session-id>/` with:

- `original/<filename>` — a read-only copy of the exact uploaded bytes.
- `row-ledger.sqlite3` — one disposition and fingerprint for every data row.
- `profile.json` — the deterministic source, accounting, column-quality, issue, and preview report.
- `process-log.jsonl` — append-only START/MIDDLE/END events, progress checkpoints, validation outcomes, and stage output summaries.

`.atlas-work` is deliberately excluded from Git because uploaded data may be private.

## What the process guarantee means

The deterministic reader enforces all of the following before releasing a profile:

- The original upload is never edited.
- SHA-256 fingerprints before and after reading must match.
- Every data row is recorded as included, included with a warning, or quarantined.
- The equation `rows read = included + quarantined` must balance.
- Duplicate rows are labelled and retained; they are not silently removed.
- `silently deleted` must remain zero.

The UI displays the process log after each completed analysis. For large files, row-processing progress is recorded every 10,000 rows. Logs contain source metadata and computed summaries, but not complete raw rows; the immutable original remains the single retained source copy.

This is a process guarantee, not a claim that every value supplied by a source is true. Bad, incomplete, or misleading source data remains visible as a limitation.

## Optional model workflow

`atlas_graph.py` contains the LangGraph analysis workflow. It requires the packages in `requirements.txt` and an Anthropic API key. Model-produced results pass through the code-level contract in `contracts.py`: every result needs calculation lineage, an independent matching recomputation, passing sanity checks, and a passing verifier verdict. If any requirement is missing, the output is `CANNOT DETERMINE` and no numerical answer is released.

## Tests

From `data-analyst-agent/data-analyst-agent`:

```powershell
python -m unittest discover -s tests -v
```
