"""Deterministic, lossless data intake and profiling for ATLAS.

The language model is deliberately absent from this module. Every value returned
here is computed from the uploaded bytes. The original upload is retained, made
read-only, fingerprinted before and after profiling, and accompanied by a
row-by-row ledger. Rows are never deleted to make a result look cleaner.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
import sqlite3
import stat
import uuid
import zipfile
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, BinaryIO
from xml.etree import ElementTree


STRUCTURED_EXTENSIONS = {".csv", ".tsv", ".json", ".jsonl", ".ndjson", ".xlsx", ".xls", ".parquet"}
TEXT_EXTENSIONS = {".txt", ".log", ".md", ".xml", ".html", ".htm"}
NULL_MARKERS = {"", "na", "n/a", "null", "none", "-", "?"}
UNIQUE_TRACKING_LIMIT = 250_000
PREVIEW_LIMIT = 25


class AnalysisError(RuntimeError):
    """An honest, user-facing failure that must not be converted into a result."""


class AuditLog:
    """Append-only structured process log for one analysis session."""

    def __init__(self, directory: Path) -> None:
        self.path = directory / "process-log.jsonl"
        self.events: list[dict[str, Any]] = []

    def emit(self, phase: str, step: str, status: str, output: dict[str, Any] | None = None) -> None:
        event = {
            "sequence": len(self.events) + 1,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "phase": phase,
            "step": step,
            "status": status,
            "output": output or {},
        }
        self.events.append(event)
        with self.path.open("a", encoding="utf-8") as destination:
            destination.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def safe_filename(value: str) -> str:
    name = Path(value).name.strip().replace("\x00", "")
    name = re.sub(r"[^A-Za-z0-9._ -]+", "_", name)
    if not name or name in {".", ".."}:
        raise AnalysisError("The uploaded file needs a valid filename.")
    return name[:180]


def detect_encoding(path: Path) -> str:
    sample = path.read_bytes()[:256_000]
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            sample.decode(encoding)
            return encoding
        except UnicodeDecodeError:
            continue
    raise AnalysisError("The file encoding could not be identified without guessing.")


def detect_delimiter(path: Path, encoding: str) -> str:
    if path.suffix.lower() == ".tsv":
        return "\t"
    with path.open("r", encoding=encoding, newline="") as source:
        sample = source.read(64_000)
    try:
        return csv.Sniffer().sniff(sample, delimiters=",\t;|").delimiter
    except csv.Error:
        return ","


def looks_numeric(value: str) -> bool:
    normalized = value.strip().replace(",", "")
    if normalized.startswith("(") and normalized.endswith(")"):
        normalized = f"-{normalized[1:-1]}"
    normalized = re.sub(r"^[\$£€₹]", "", normalized)
    try:
        Decimal(normalized)
        return True
    except InvalidOperation:
        return False


def looks_like_date(value: str) -> bool:
    candidate = value.strip()
    formats = (
        "%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S",
        "%m/%d/%Y", "%d/%m/%Y", "%m/%d/%Y %H:%M:%S",
    )
    return any(_parses_as(candidate, pattern) for pattern in formats)


def _parses_as(value: str, pattern: str) -> bool:
    try:
        datetime.strptime(value[:19], pattern)
        return True
    except ValueError:
        return False


@dataclass
class ColumnStats:
    name: str
    rows: int = 0
    missing: int = 0
    whitespace_issues: int = 0
    numeric: int = 0
    date_like: int = 0
    text: int = 0
    examples: list[str] = field(default_factory=list)
    _unique: set[str] = field(default_factory=set, repr=False)
    unique_exact: bool = True

    def observe(self, raw_value: Any) -> None:
        self.rows += 1
        value = "" if raw_value is None else str(raw_value)
        stripped = value.strip()
        if value != stripped:
            self.whitespace_issues += 1
        if stripped.lower() in NULL_MARKERS:
            self.missing += 1
            return
        if len(self.examples) < 3 and stripped not in self.examples:
            self.examples.append(stripped[:160])
        if self.unique_exact:
            self._unique.add(stripped)
            if len(self._unique) > UNIQUE_TRACKING_LIMIT:
                self._unique.clear()
                self.unique_exact = False
        if looks_numeric(stripped):
            self.numeric += 1
        elif looks_like_date(stripped):
            self.date_like += 1
        else:
            self.text += 1

    def as_dict(self) -> dict[str, Any]:
        populated = self.rows - self.missing
        observed_types = sum(value > 0 for value in (self.numeric, self.date_like, self.text))
        concerns: list[str] = []
        if self.missing:
            concerns.append(f"{self.missing} missing or sentinel values")
        if self.whitespace_issues:
            concerns.append(f"{self.whitespace_issues} values contain outer whitespace")
        if observed_types > 1:
            concerns.append("mixed value types")
        return {
            "name": self.name,
            "rows": self.rows,
            "populated": populated,
            "missing": self.missing,
            "missingPercent": round(self.missing / self.rows * 100, 4) if self.rows else 0,
            "numericValues": self.numeric,
            "dateLikeValues": self.date_like,
            "textValues": self.text,
            "inferredType": self._inferred_type(populated),
            "uniqueCount": len(self._unique) if self.unique_exact else None,
            "uniqueCountExact": self.unique_exact,
            "examples": self.examples,
            "concerns": concerns,
        }

    def _inferred_type(self, populated: int) -> str:
        if populated == 0:
            return "empty"
        if self.numeric == populated:
            return "number"
        if self.date_like == populated:
            return "date/time"
        if self.text == populated:
            return "text"
        return "mixed"


def _row_hash(values: list[str]) -> str:
    payload = json.dumps(values, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class RowLedger:
    def __init__(self, directory: Path) -> None:
        self.path = directory / "row-ledger.sqlite3"
        self.connection = sqlite3.connect(self.path)
        self.connection.execute("PRAGMA journal_mode=WAL")
        self.connection.execute("PRAGMA synchronous=NORMAL")
        self.connection.execute(
            "CREATE TABLE rows (row_number INTEGER PRIMARY KEY, row_hash TEXT NOT NULL, "
            "disposition TEXT NOT NULL, reason TEXT)"
        )
        self.connection.execute(
            "CREATE TABLE fingerprints (row_hash TEXT PRIMARY KEY, first_row INTEGER NOT NULL, "
            "occurrences INTEGER NOT NULL)"
        )

    def record(self, row_number: int, values: list[str], disposition: str, reason: str | None) -> bool:
        fingerprint = _row_hash(values)
        existing = self.connection.execute(
            "SELECT first_row, occurrences FROM fingerprints WHERE row_hash = ?", (fingerprint,)
        ).fetchone()
        duplicate = existing is not None
        if existing:
            self.connection.execute(
                "UPDATE fingerprints SET occurrences = occurrences + 1 WHERE row_hash = ?", (fingerprint,)
            )
        else:
            self.connection.execute(
                "INSERT INTO fingerprints(row_hash, first_row, occurrences) VALUES (?, ?, 1)",
                (fingerprint, row_number),
            )
        final_disposition = "included_with_warning" if duplicate and disposition == "included" else disposition
        final_reason = "exact duplicate retained" if duplicate and not reason else reason
        self.connection.execute(
            "INSERT INTO rows(row_number, row_hash, disposition, reason) VALUES (?, ?, ?, ?)",
            (row_number, fingerprint, final_disposition, final_reason),
        )
        return duplicate

    def close(self) -> None:
        self.connection.commit()
        self.connection.close()


def iter_delimited(path: Path, encoding: str, delimiter: str) -> tuple[list[str], Iterator[list[str]]]:
    source = path.open("r", encoding=encoding, newline="")
    reader = csv.reader(source, delimiter=delimiter)
    try:
        header = next(reader)
    except StopIteration as error:
        source.close()
        raise AnalysisError("The file is empty.") from error
    header = [value.strip() or f"column_{index + 1}" for index, value in enumerate(header)]

    def rows() -> Iterator[list[str]]:
        try:
            yield from reader
        finally:
            source.close()

    return header, rows()


def iter_json_lines(path: Path, encoding: str) -> tuple[list[str], Iterator[list[str]]]:
    source = path.open("r", encoding=encoding)
    first: dict[str, Any] | None = None
    first_line_number = 0
    for line_number, line in enumerate(source, start=1):
        if not line.strip():
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError as error:
            source.close()
            raise AnalysisError(f"JSON line {line_number} is invalid: {error.msg}.") from error
        if not isinstance(parsed, dict):
            source.close()
            raise AnalysisError("JSON Lines input must contain one object per line.")
        first = parsed
        first_line_number = line_number
        break
    if first is None:
        source.close()
        raise AnalysisError("The file contains no JSON objects.")
    header = list(first.keys())

    def rows() -> Iterator[list[str]]:
        current = first
        next_line_number = first_line_number + 1
        try:
            while current is not None:
                yield ["" if current.get(key) is None else str(current.get(key)) for key in header]
                current = None
                for line_number, line in enumerate(source, start=next_line_number):
                    next_line_number = line_number + 1
                    if not line.strip():
                        continue
                    try:
                        parsed = json.loads(line)
                    except json.JSONDecodeError as error:
                        raise AnalysisError(f"JSON line {line_number} is invalid: {error.msg}.") from error
                    if not isinstance(parsed, dict):
                        raise AnalysisError(f"JSON line {line_number} is not an object.")
                    current = parsed
                    break
        finally:
            source.close()

    return header, rows()


def iter_json(path: Path, encoding: str) -> tuple[list[str], Iterator[list[str]]]:
    try:
        payload = json.loads(path.read_text(encoding=encoding))
    except json.JSONDecodeError as error:
        raise AnalysisError(f"JSON input is invalid: {error.msg} at line {error.lineno}.") from error
    records = payload if isinstance(payload, list) else [payload]
    if not records:
        raise AnalysisError("The JSON file contains no records.")
    if all(isinstance(record, dict) for record in records):
        headers = list(dict.fromkeys(key for record in records for key in record.keys()))
        return headers, iter([
            ["" if record.get(key) is None else str(record.get(key)) for key in headers]
            for record in records
        ])
    return ["value"], iter([[json.dumps(record, ensure_ascii=False)] for record in records])


def iter_plain_text(path: Path, encoding: str) -> tuple[list[str], Iterator[list[str]]]:
    def rows() -> Iterator[list[str]]:
        with path.open("r", encoding=encoding, errors="strict") as source:
            for line_number, line in enumerate(source, start=1):
                yield [str(line_number), line.rstrip("\r\n")]
    return ["line_number", "text"], rows()


def iter_docx(path: Path) -> tuple[list[str], Iterator[list[str]]]:
    try:
        with zipfile.ZipFile(path) as archive:
            document = archive.read("word/document.xml")
    except (zipfile.BadZipFile, KeyError) as error:
        raise AnalysisError("The DOCX package is invalid or has no readable document body.") from error
    try:
        root = ElementTree.fromstring(document)
    except ElementTree.ParseError as error:
        raise AnalysisError("The DOCX document body contains invalid XML.") from error
    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    paragraphs: list[list[str]] = []
    for paragraph in root.iter(f"{namespace}p"):
        text = "".join(node.text or "" for node in paragraph.iter(f"{namespace}t")).strip()
        if text:
            paragraphs.append([str(len(paragraphs) + 1), text])
    return ["paragraph_number", "text"], iter(paragraphs)


def iter_pdf(path: Path) -> tuple[list[str], Iterator[list[str]]]:
    try:
        from pypdf import PdfReader
    except ImportError as error:
        raise AnalysisError("PDF text extraction requires the pypdf package. Run: pip install -r requirements.txt") from error
    try:
        reader = PdfReader(str(path))
        pages = [[str(index), page.extract_text() or ""] for index, page in enumerate(reader.pages, start=1)]
    except Exception as error:
        raise AnalysisError(f"PDF text extraction failed safely: {error}") from error
    return ["page_number", "text"], iter(pages)


def iter_excel(path: Path) -> tuple[list[str], Iterator[list[str]]]:
    try:
        import pandas as pd
    except ImportError as error:
        raise AnalysisError("Spreadsheet extraction requires pandas and openpyxl. Run: pip install -r requirements.txt") from error
    try:
        sheets = pd.read_excel(path, sheet_name=None, dtype=str)
        for frame in sheets.values():
            frame.columns = [str(column) for column in frame.columns]
    except Exception as error:
        raise AnalysisError(f"Spreadsheet extraction failed safely: {error}") from error
    all_columns = list(dict.fromkeys(str(column) for frame in sheets.values() for column in frame.columns))
    headers = ["sheet_name", *all_columns]

    def rows() -> Iterator[list[str]]:
        for sheet_name, frame in sheets.items():
            for record in frame.to_dict(orient="records"):
                yield [str(sheet_name), *[
                    "" if record.get(column) is None else str(record.get(column)) for column in all_columns
                ]]
    return headers, rows()


def iter_parquet(path: Path) -> tuple[list[str], Iterator[list[str]]]:
    try:
        import pyarrow.parquet as parquet
    except ImportError as error:
        raise AnalysisError("Parquet extraction requires pyarrow. Run: pip install -r requirements.txt") from error
    try:
        table = parquet.read_table(path)
    except Exception as error:
        raise AnalysisError(f"Parquet extraction failed safely: {error}") from error
    headers = list(table.column_names)

    def rows() -> Iterator[list[str]]:
        for batch in table.to_batches(max_chunksize=10_000):
            for record in batch.to_pylist():
                yield ["" if record.get(column) is None else str(record.get(column)) for column in headers]
    return headers, rows()


def iter_binary_metadata(path: Path, fingerprint: str) -> tuple[list[str], Iterator[list[str]]]:
    values = [
        ["filename", path.name],
        ["extension", path.suffix.lower() or "none"],
        ["size_bytes", str(path.stat().st_size)],
        ["sha256", fingerprint],
    ]
    return ["property", "value"], iter(values)


def profile_file(original: Path, analysis_dir: Path, audit: AuditLog | None = None) -> dict[str, Any]:
    audit = audit or AuditLog(analysis_dir)
    audit.emit("START" if not audit.events else "MIDDLE", "analysis_started", "running", {"source": original.name})
    extension = original.suffix.lower()
    before_hash = sha256_file(original)
    audit.emit("MIDDLE", "source_fingerprinted", "passed", {
        "sha256": before_hash, "bytes": original.stat().st_size,
    })
    encoding: str | None = None
    delimiter: str | None = None
    extraction_mode = "structured"
    extraction_note: str | None = None
    try:
        if original.name.startswith("._") or original.name in {".DS_Store", "Thumbs.db"}:
            headers, rows = iter_binary_metadata(original, before_hash)
            extraction_mode = "metadata_only"
            extraction_note = "This is an operating-system metadata sidecar, not the corresponding business document. It was preserved but not parsed as business data."
        elif extension in {".csv", ".tsv"}:
            encoding = detect_encoding(original)
            delimiter = detect_delimiter(original, encoding)
            headers, rows = iter_delimited(original, encoding, delimiter)
        elif extension in {".jsonl", ".ndjson"}:
            encoding = detect_encoding(original)
            headers, rows = iter_json_lines(original, encoding)
        elif extension == ".json":
            encoding = detect_encoding(original)
            headers, rows = iter_json(original, encoding)
        elif extension in TEXT_EXTENSIONS:
            encoding = detect_encoding(original)
            headers, rows = iter_plain_text(original, encoding)
            extraction_mode = "text_lines"
        elif extension == ".docx":
            headers, rows = iter_docx(original)
            extraction_mode = "document_paragraphs"
        elif extension == ".pdf":
            headers, rows = iter_pdf(original)
            extraction_mode = "document_pages"
        elif extension in {".xlsx", ".xls"}:
            headers, rows = iter_excel(original)
            extraction_mode = "workbook_rows"
        elif extension == ".parquet":
            headers, rows = iter_parquet(original)
            extraction_mode = "parquet_rows"
        else:
            headers, rows = iter_binary_metadata(original, before_hash)
            extraction_mode = "metadata_only"
            extraction_note = "No safe content extractor is enabled for this format; the file was preserved and identified only."
    except AnalysisError as error:
        audit.emit("END", "source_parsing", "failed", {"reason": str(error)})
        raise
    audit.emit("MIDDLE", "format_detected", "passed", {
        "format": extension.lstrip("."), "encoding": encoding, "delimiter": delimiter,
        "extractionMode": extraction_mode, "columnCount": len(headers), "columns": headers,
    })

    columns = [ColumnStats(name=value) for value in headers]
    ledger = RowLedger(analysis_dir)
    preview: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []
    total = included = quarantined = duplicate_count = 0
    audit.emit("MIDDLE", "row_processing", "running", {"rowsProcessed": 0})

    try:
        for row_number, raw_values in enumerate(rows, start=1):
            total += 1
            values = [str(value) for value in raw_values]
            reason: str | None = None
            disposition = "included"
            if len(values) != len(headers):
                disposition = "quarantined"
                reason = f"expected {len(headers)} columns, received {len(values)}"
                quarantined += 1
                if len(issues) < 100:
                    issues.append({"severity": "critical", "row": row_number, "description": reason})
            else:
                included += 1
                for column, value in zip(columns, values, strict=True):
                    column.observe(value)

            duplicate = ledger.record(row_number, values, disposition, reason)
            if duplicate:
                duplicate_count += 1
            if len(preview) < PREVIEW_LIMIT:
                preview.append({
                    "rowNumber": row_number,
                    "disposition": "included_with_warning" if duplicate and disposition == "included" else disposition,
                    "values": dict(zip(headers, values, strict=False)),
                })
            if total % 10_000 == 0:
                audit.emit("MIDDLE", "row_processing", "running", {
                    "rowsProcessed": total, "included": included, "quarantined": quarantined,
                    "duplicatesRetained": duplicate_count,
                })
    except Exception as error:
        audit.emit("END", "row_processing", "failed", {
            "rowsProcessed": total, "reason": str(error),
        })
        raise
    finally:
        ledger.close()

    audit.emit("MIDDLE", "row_processing", "passed", {
        "rowsProcessed": total, "included": included, "quarantined": quarantined,
        "duplicatesRetained": duplicate_count,
    })

    for column in columns:
        if column.missing:
            issues.append({
                "severity": "warning",
                "column": column.name,
                "description": f"{column.missing} missing or sentinel values retained",
            })
        if column.whitespace_issues:
            issues.append({
                "severity": "note",
                "column": column.name,
                "description": f"{column.whitespace_issues} values contain outer whitespace",
            })

    after_hash = sha256_file(original)
    integrity_verified = before_hash == after_hash
    if not integrity_verified:
        audit.emit("END", "integrity_validation", "failed", {
            "sha256Before": before_hash, "sha256After": after_hash,
        })
        raise AnalysisError("The source fingerprint changed during analysis. No results were released.")
    if total != included + quarantined:
        audit.emit("END", "row_accounting_validation", "failed", {
            "rowsRead": total, "included": included, "quarantined": quarantined,
        })
        raise AnalysisError("Row accounting failed. No results were released.")
    audit.emit("MIDDLE", "release_checks", "passed", {
        "sourceIntegrity": True, "rowAccountingBalanced": True, "silentlyDeleted": 0,
    })

    result = {
        "status": "VERIFIED_PROCESS",
        "confidence": "The source was preserved and every reported profile value was computed deterministically.",
        "source": {
            "name": original.name,
            "bytes": original.stat().st_size,
            "format": extension.lstrip("."),
            "encoding": encoding,
            "delimiter": delimiter,
            "extractionMode": extraction_mode,
            "extractionNote": extraction_note,
            "sha256Before": before_hash,
            "sha256After": after_hash,
            "integrityVerified": integrity_verified,
        },
        "accounting": {
            "rowsRead": total,
            "included": included,
            "quarantined": quarantined,
            "duplicatesRetained": duplicate_count,
            "silentlyDeleted": 0,
            "equation": f"{total} rows read = {included} included + {quarantined} quarantined",
            "balanced": total == included + quarantined,
        },
        "columns": [column.as_dict() for column in columns],
        "issues": issues,
        "preview": preview,
        "artifacts": {
            "original": str(original),
            "rowLedger": str(analysis_dir / "row-ledger.sqlite3"),
            "processLog": str(audit.path),
        },
        "limitations": [
            "A verified process cannot prove that incorrect source values represent real-world truth.",
            "Question answering and statistical modelling require the separate ATLAS model workflow.",
        ],
    }
    if extraction_note:
        result["limitations"].insert(0, extraction_note)
    audit.emit("END", "analysis_completed", "passed", {
        "status": result["status"], "rowsRead": total, "columnsProfiled": len(columns),
        "issuesReported": len(issues),
    })
    result["process"] = {"eventCount": len(audit.events), "events": audit.events}
    (analysis_dir / "profile.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def preserve_upload(stream: BinaryIO, filename: str, workspace: Path, content_length: int | None = None) -> Path:
    safe_name = safe_filename(filename)
    session_dir = workspace / str(uuid.uuid4())
    original_dir = session_dir / "original"
    original_dir.mkdir(parents=True, exist_ok=False)
    target = original_dir / safe_name
    remaining = content_length
    with target.open("xb") as destination:
        while remaining is None or remaining > 0:
            request_size = 1024 * 1024 if remaining is None else min(1024 * 1024, remaining)
            chunk = stream.read(request_size)
            if not chunk:
                break
            destination.write(chunk)
            if remaining is not None:
                remaining -= len(chunk)
    if target.stat().st_size == 0:
        raise AnalysisError("The uploaded file is empty.")
    target.chmod(stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
    return target


def copy_source_immutably(source: Path, workspace: Path) -> Path:
    if not source.is_file():
        raise AnalysisError(f"Source file not found: {source}")
    session_dir = workspace / str(uuid.uuid4())
    original_dir = session_dir / "original"
    original_dir.mkdir(parents=True, exist_ok=False)
    target = original_dir / safe_filename(source.name)
    shutil.copy2(source, target)
    target.chmod(stat.S_IREAD | stat.S_IRGRP | stat.S_IROTH)
    return target


def analysis_directory(original: Path) -> Path:
    if original.parent.name != "original":
        raise AnalysisError("The preserved source is not inside an analysis session.")
    return original.parent.parent
