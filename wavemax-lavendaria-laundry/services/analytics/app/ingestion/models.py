from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any

RawCell = str | int | float | bool | date | datetime | Decimal | None
RawRecord = tuple[RawCell, ...]


class OutcomeStatus(StrEnum):
    ACCEPTED = "ACCEPTED"
    QUARANTINED = "QUARANTINED"


@dataclass(frozen=True, slots=True)
class WdfSalesLine:
    paid_date: date
    order_number: str
    store: str
    category: str | None
    department: str | None
    line_item_name: str
    quantity: Decimal
    units: str | None
    line_item_subtotal: Decimal
    tax_1: Decimal
    tax_2: Decimal
    tax_3: Decimal
    line_item_note: str | None
    laundry_service_item: bool


@dataclass(frozen=True, slots=True)
class RowOutcome:
    source_row_number: int
    source_row_identity: str
    raw_record_hash: str
    raw_record: RawRecord
    status: OutcomeStatus
    reason_codes: tuple[str, ...]
    warning_codes: tuple[str, ...]
    parsed: WdfSalesLine | None


@dataclass(frozen=True, slots=True)
class IngestionSummary:
    run_id: str
    source_sha256: str
    source_size_bytes: int
    storage_key: str
    retained_copy_created: bool
    parser_version: str
    rule_version: str
    input_rows: int
    accepted_rows: int
    quarantined_rows: int
    reason_counts: dict[str, int]
    warning_counts: dict[str, int]
    negative_subtotal_rows: int
    zero_subtotal_rows: int

    def assert_complete_accounting(self) -> None:
        if self.input_rows != self.accepted_rows + self.quarantined_rows:
            raise AssertionError("Input rows do not equal accepted plus quarantined rows")

    def as_safe_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "source_system": "WDF_POS",
            "source_kind": "wdf_annual_sales_xlsx",
            "source_sha256": self.source_sha256,
            "source_size_bytes": self.source_size_bytes,
            "storage_key": self.storage_key,
            "retained_copy_created": self.retained_copy_created,
            "parser_version": self.parser_version,
            "rule_version": self.rule_version,
            "input_rows": self.input_rows,
            "accepted_rows": self.accepted_rows,
            "quarantined_rows": self.quarantined_rows,
            "reason_counts": dict(sorted(self.reason_counts.items())),
            "warning_counts": dict(sorted(self.warning_counts.items())),
            "negative_subtotal_rows": self.negative_subtotal_rows,
            "zero_subtotal_rows": self.zero_subtotal_rows,
        }
