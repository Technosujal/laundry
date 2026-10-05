from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from io import StringIO
from pathlib import Path
from typing import Any

import pytest

from app.ingestion.run_wdf_sales import run_wdf_sales_ingestion
from app.observability.events import IngestionEventLogger

WorkbookFactory = Callable[..., Path]


def test_run_accounts_for_every_row_and_emits_safe_stage_logs(
    workbook_factory: WorkbookFactory, valid_row: list[Any], tmp_path: Path
) -> None:
    malformed = deepcopy(valid_row)
    malformed[0] = "bad-date"
    source = workbook_factory([valid_row, valid_row, malformed])
    logs = StringIO()
    summary_path = tmp_path / "summaries" / "run.json"

    first = run_wdf_sales_ingestion(
        source=source,
        raw_store=tmp_path / "raw",
        summary_output=summary_path,
        logger=IngestionEventLogger(logs),
    )
    second = run_wdf_sales_ingestion(
        source=source,
        raw_store=tmp_path / "raw",
        summary_output=summary_path,
        logger=IngestionEventLogger(StringIO()),
    )

    assert first.input_rows == 3
    assert first.accepted_rows == 2
    assert first.quarantined_rows == 1
    assert first.input_rows == first.accepted_rows + first.quarantined_rows
    assert first.warning_counts == {"EXACT_CONTENT_REPEAT": 1}
    assert first.run_id == second.run_id
    assert first.storage_key == second.storage_key
    assert first.retained_copy_created is True
    assert second.retained_copy_created is False
    output = logs.getvalue()
    assert '"event":"ingestion.started"' in output
    assert '"event":"source.retained"' in output
    assert '"event":"parse.completed"' in output
    assert '"event":"validation.completed"' in output
    assert '"event":"ingestion.completed"' in output
    assert '"warning_counts":{"EXACT_CONTENT_REPEAT":1}' in output
    assert "ORDER-TEST" not in output
    assert "synthetic-private-note" not in output


def test_summary_never_contains_source_field_values(
    workbook_factory: WorkbookFactory, valid_row: list[Any], tmp_path: Path
) -> None:
    source = workbook_factory([valid_row])
    summary_path = tmp_path / "run.json"
    run_wdf_sales_ingestion(
        source=source,
        raw_store=tmp_path / "raw",
        summary_output=summary_path,
        logger=IngestionEventLogger(StringIO()),
    )

    output = summary_path.read_text(encoding="utf-8")
    assert "ORDER-TEST" not in output
    assert "synthetic-private-note" not in output
    assert "Wash and fold" not in output


def test_failure_log_reports_a_safe_error_code_without_source_values(
    workbook_factory: WorkbookFactory, valid_row: list[Any], tmp_path: Path
) -> None:
    changed_headers = (
        "Private Customer Value",
        "Private Order Value",
        *[f"Changed {index}" for index in range(12)],
    )
    source = workbook_factory([valid_row], changed_headers)
    logs = StringIO()

    with pytest.raises(ValueError, match="headers"):
        run_wdf_sales_ingestion(
            source=source,
            raw_store=tmp_path / "raw",
            summary_output=None,
            logger=IngestionEventLogger(logs),
        )

    output = logs.getvalue()
    assert '"event":"ingestion.failed"' in output
    assert '"error_code":"SourceSchemaError"' in output
    assert "Private Customer Value" not in output
    assert "Private Order Value" not in output
