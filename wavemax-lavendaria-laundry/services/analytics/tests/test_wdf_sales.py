from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest

from app.ingestion.fingerprint import fingerprint_file
from app.ingestion.models import OutcomeStatus
from app.ingestion.wdf_sales import (
    EXPECTED_HEADERS,
    SourceSchemaError,
    parse_wdf_sales_workbook,
)

WorkbookFactory = Callable[..., Path]


def parse(path: Path):
    fingerprint = fingerprint_file(path)
    return list(parse_wdf_sales_workbook(path, source_sha256=fingerprint.sha256))


def test_parses_valid_values_with_decimal_money(
    workbook_factory: WorkbookFactory, valid_row: list[Any]
) -> None:
    outcome = parse(workbook_factory([valid_row]))[0]

    assert outcome.status is OutcomeStatus.ACCEPTED
    assert outcome.reason_codes == ()
    assert outcome.parsed is not None
    assert outcome.parsed.paid_date == date(2025, 1, 2)
    assert outcome.parsed.line_item_subtotal == Decimal("12.34")


def test_retains_duplicate_negative_and_zero_rows_as_accepted(
    workbook_factory: WorkbookFactory, valid_row: list[Any]
) -> None:
    negative = deepcopy(valid_row)
    negative[1] = "ORDER-TEST-2"
    negative[8] = -2.5
    zero = deepcopy(valid_row)
    zero[1] = "ORDER-TEST-3"
    zero[8] = 0
    outcomes = parse(workbook_factory([valid_row, valid_row, negative, zero]))

    assert [outcome.status for outcome in outcomes] == [OutcomeStatus.ACCEPTED] * 4
    assert outcomes[1].warning_codes == ("EXACT_CONTENT_REPEAT",)
    assert outcomes[2].parsed is not None
    assert outcomes[2].parsed.line_item_subtotal == Decimal("-2.5")
    assert outcomes[3].parsed is not None
    assert outcomes[3].parsed.line_item_subtotal == Decimal("0")


def test_quarantines_malformed_row_with_all_reasons(
    workbook_factory: WorkbookFactory, valid_row: list[Any]
) -> None:
    malformed = deepcopy(valid_row)
    malformed[0] = "not-a-date"
    malformed[1] = None
    malformed[6] = "not-a-number"
    malformed[13] = "yes"
    outcome = parse(workbook_factory([malformed]))[0]

    assert outcome.status is OutcomeStatus.QUARANTINED
    assert outcome.parsed is None
    assert set(outcome.reason_codes) == {
        "LAUNDRY_SERVICE_ITEM_INVALID",
        "ORDER_NUMBER_MISSING",
        "PAID_DATE_INVALID",
        "QUANTITY_INVALID",
    }


def test_rejects_changed_headers_before_parsing_rows(
    workbook_factory: WorkbookFactory, valid_row: list[Any]
) -> None:
    changed = list(EXPECTED_HEADERS)
    changed[1] = "Order Identifier"
    path = workbook_factory([valid_row], tuple(changed))

    with pytest.raises(SourceSchemaError, match="headers"):
        parse(path)


def test_source_row_identity_is_stable_and_position_specific(
    workbook_factory: WorkbookFactory, valid_row: list[Any]
) -> None:
    path = workbook_factory([valid_row, valid_row])
    first = parse(path)
    second = parse(path)

    assert [row.source_row_identity for row in first] == [row.source_row_identity for row in second]
    assert first[0].source_row_identity != first[1].source_row_identity
