from __future__ import annotations

import csv
from collections.abc import Iterator
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from pathlib import Path

from app.ingestion.laundro_models import (
    DailyPoint,
    DailyRowOutcome,
    DailySeriesSpec,
    MachineScope,
    MeasureUnit,
)
from app.ingestion.models import OutcomeStatus

PARSER_VERSION = "laundro-daily-csv/1.0.0"
RULE_VERSION = "laundro-daily-quality/1.0.0"
EXPECTED_HEADERS = ("Day", "Amount")


class LaundroSchemaError(ValueError):
    """Raised when a file cannot be safely identified as the approved daily-history export."""


DAILY_SERIES: tuple[DailySeriesSpec, ...] = (
    DailySeriesSpec(
        series_id="machine_revenue",
        filename="history_report - Machine Revenue.csv",
        measure_label="Machine revenue",
        unit=MeasureUnit.CURRENCY_USD,
        machine_scope=MachineScope.ALL_MACHINES,
        business_event="Value spent at machines, across washers and dryers.",
        coverage_note=(
            "Covers all 56 machines and reconciles exactly to the machine breakdown export."
        ),
    ),
    DailySeriesSpec(
        series_id="washer_cycles",
        filename="history_report - Machine Cycles (All Washers).csv",
        measure_label="Washer cycles",
        unit=MeasureUnit.COUNT,
        machine_scope=MachineScope.WASHERS_ONLY,
        business_event="Completed washer cycles.",
        coverage_note=(
            "Washers only. The supplied export excludes dryers, which report revenue but no "
            "cycles here, so this must never be used as a denominator for all-machine revenue."
        ),
    ),
    DailySeriesSpec(
        series_id="card_payments",
        filename="history_report - Payments.csv",
        measure_label="Card value loaded",
        unit=MeasureUnit.CURRENCY_USD,
        machine_scope=MachineScope.NOT_MACHINE_SCOPED,
        business_event="Value loaded onto laundry cards by customers.",
        coverage_note=(
            "Value loaded is not sales and not machine revenue. It is a separate business event "
            "and must never be added to either."
        ),
    ),
    DailySeriesSpec(
        series_id="accounts_used",
        filename="history_report - Number of Accounts Used.csv",
        measure_label="Accounts used",
        unit=MeasureUnit.COUNT,
        machine_scope=MachineScope.NOT_MACHINE_SCOPED,
        business_event="Card accounts active on a given day.",
        coverage_note=(
            "Counts daily activity, not unique customers. Summing across days double-counts "
            "returning customers and must not be presented as a customer count."
        ),
    ),
    DailySeriesSpec(
        series_id="new_cards",
        filename="history_report - New Cards Dispensed.csv",
        measure_label="New cards dispensed",
        unit=MeasureUnit.COUNT,
        machine_scope=MachineScope.NOT_MACHINE_SCOPED,
        business_event="Laundry cards issued.",
        coverage_note="Does not identify the customer behind a card.",
    ),
    DailySeriesSpec(
        series_id="free_starts",
        filename="history_report - Free Starts.csv",
        measure_label="Management card starts value",
        unit=MeasureUnit.CURRENCY_USD,
        machine_scope=MachineScope.ALL_MACHINES,
        business_event="Cycle value started on management cards rather than paid customer value.",
        coverage_note=(
            "Proven identical to the vendor's Management Card Starts measure. Its accounting "
            "treatment, as cost, discount, or exclusion, is an unanswered client decision."
        ),
    ),
)

SERIES_BY_ID = {spec.series_id: spec for spec in DAILY_SERIES}


def parse_daily_series(
    path: Path, *, spec: DailySeriesSpec, source_sha256: str
) -> Iterator[DailyRowOutcome]:
    if path.suffix.lower() != ".csv":
        raise LaundroSchemaError("A daily-history source must use the .csv format")

    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.reader(stream)
        try:
            headers = tuple((value or "").strip() for value in next(reader))
        except StopIteration as error:
            raise LaundroSchemaError(f"{spec.filename} is empty") from error
        if headers != EXPECTED_HEADERS:
            raise LaundroSchemaError(
                f"{spec.filename} headers do not match the approved schema {EXPECTED_HEADERS}"
            )

        seen_days: set[date] = set()
        for source_row_number, values in enumerate(reader, start=2):
            raw = _fixed_width(values)
            identity = sha256(
                f"{source_sha256}:{spec.series_id}:{source_row_number}".encode()
            ).hexdigest()
            parsed, reasons = _parse_row(raw, spec)
            warnings: list[str] = []
            if parsed is not None:
                if parsed.day in seen_days:
                    warnings.append("DUPLICATE_DAY")
                else:
                    seen_days.add(parsed.day)
                if parsed.amount < 0:
                    warnings.append("NEGATIVE_AMOUNT")
                if parsed.amount == 0:
                    warnings.append("ZERO_AMOUNT")
                is_whole = parsed.amount == parsed.amount.to_integral_value()
                if spec.unit is MeasureUnit.COUNT and not is_whole:
                    warnings.append("NON_INTEGER_COUNT")

            status = OutcomeStatus.QUARANTINED if reasons else OutcomeStatus.ACCEPTED
            yield DailyRowOutcome(
                source_row_number=source_row_number,
                source_row_identity=identity,
                raw_record=raw,
                status=status,
                reason_codes=tuple(sorted(set(reasons))),
                warning_codes=tuple(warnings),
                parsed=parsed if status is OutcomeStatus.ACCEPTED else None,
            )


def _fixed_width(values: list[str]) -> tuple[str | None, ...]:
    width = len(EXPECTED_HEADERS)
    padded = [v if (v or "").strip() else None for v in values[:width]]
    padded.extend([None] * max(0, width - len(padded)))
    return tuple(padded)


def _parse_row(
    raw: tuple[str | None, ...], spec: DailySeriesSpec
) -> tuple[DailyPoint | None, list[str]]:
    if all(value is None for value in raw):
        return None, ["ROW_EMPTY"]

    reasons: list[str] = []
    day = _date_value(raw[0], reasons)
    amount = _decimal_value(raw[1], reasons)
    if reasons or day is None or amount is None:
        return None, reasons or ["ROW_INVALID"]
    return DailyPoint(day=day, amount=amount), []


def _date_value(value: str | None, reasons: list[str]) -> date | None:
    if value is None:
        reasons.append("DAY_MISSING")
        return None
    try:
        return datetime.strptime(value.strip(), "%Y-%m-%d").date()
    except ValueError:
        reasons.append("DAY_INVALID")
        return None


def _decimal_value(value: str | None, reasons: list[str]) -> Decimal | None:
    if value is None:
        reasons.append("AMOUNT_MISSING")
        return None
    try:
        result = Decimal(value.strip())
    except (InvalidOperation, ValueError):
        reasons.append("AMOUNT_INVALID")
        return None
    if not result.is_finite():
        reasons.append("AMOUNT_INVALID")
        return None
    return result
