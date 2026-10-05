from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import pytest
from openpyxl import Workbook

from app.ingestion.wdf_sales import EXPECTED_HEADERS, SHEET_NAME


@pytest.fixture
def workbook_factory(tmp_path: Path):
    def create(rows: list[list[Any]], headers: tuple[str, ...] = EXPECTED_HEADERS) -> Path:
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = SHEET_NAME
        sheet.append(list(headers))
        for row in rows:
            sheet.append(row)
        path = tmp_path / "source.xlsx"
        workbook.save(path)
        workbook.close()
        return path

    return create


@pytest.fixture
def valid_row() -> list[Any]:
    return [
        datetime(2025, 1, 2, 10, 30),
        "ORDER-TEST-1",
        "TEST STORE",
        "Laundry",
        "Service",
        "Wash and fold",
        1,
        "lb",
        12.34,
        0.5,
        0,
        0,
        "synthetic-private-note",
        True,
    ]
