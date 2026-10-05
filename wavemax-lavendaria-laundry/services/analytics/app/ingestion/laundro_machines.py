from __future__ import annotations

import csv
from collections.abc import Iterator
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from pathlib import Path

from app.ingestion.laundro_models import MachineRowOutcome, MachineTotal
from app.ingestion.models import OutcomeStatus

PARSER_VERSION = "laundro-machines-csv/1.0.0"
RULE_VERSION = "laundro-machines-quality/1.0.0"
EXPECTED_HEADERS = ("Machine", "Total Revenue", "Total Cycles")
SOURCE_FILENAME = "Machine Breakdown Report - Individual Machine Totals-3.csv"

WASHER = "WASHER"
DRYER = "DRYER"
UNKNOWN = "UNKNOWN"


class LaundroMachineSchemaError(ValueError):
    """Raised when the machine breakdown file does not match the approved schema."""


def classify_machine(machine: str) -> str:
    """Classify by the vendor's machine-identifier prefix.

    The supplied export uses W-prefixed washers and D-prefixed dryers. Anything else is
    left UNKNOWN rather than guessed, because machine class decides which measures a
    machine may contribute to.
    """
    name = machine.strip().upper()
    if name.startswith("W"):
        return WASHER
    if name.startswith("D"):
        return DRYER
    return UNKNOWN


def parse_machine_totals(path: Path, *, source_sha256: str) -> Iterator[MachineRowOutcome]:
    if path.suffix.lower() != ".csv":
        raise LaundroMachineSchemaError("The machine breakdown source must use the .csv format")

    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.reader(stream)
        try:
            headers = tuple((value or "").strip() for value in next(reader))
        except StopIteration as error:
            raise LaundroMachineSchemaError("Machine breakdown export is empty") from error
        if headers != EXPECTED_HEADERS:
            raise LaundroMachineSchemaError(
                f"Machine breakdown headers do not match the approved schema {EXPECTED_HEADERS}"
            )

        seen: set[str] = set()
        for source_row_number, values in enumerate(reader, start=2):
            raw = _fixed_width(values)
            identity = sha256(
                f"{source_sha256}:machine_totals:{source_row_number}".encode()
            ).hexdigest()
            parsed, reasons = _parse_row(raw)
            warnings: list[str] = []
            if parsed is not None:
                if parsed.machine in seen:
                    warnings.append("DUPLICATE_MACHINE")
                else:
                    seen.add(parsed.machine)
                if parsed.machine_class == UNKNOWN:
                    warnings.append("UNCLASSIFIED_MACHINE")
                if parsed.total_cycles == 0 and parsed.total_revenue > 0:
                    # Expected for dryers in this export; recorded so the gap stays visible.
                    warnings.append("REVENUE_WITHOUT_CYCLES")

            status = OutcomeStatus.QUARANTINED if reasons else OutcomeStatus.ACCEPTED
            yield MachineRowOutcome(
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


def _parse_row(raw: tuple[str | None, ...]) -> tuple[MachineTotal | None, list[str]]:
    if all(value is None for value in raw):
        return None, ["ROW_EMPTY"]

    reasons: list[str] = []
    machine = raw[0].strip() if raw[0] is not None else None
    if not machine:
        reasons.append("MACHINE_MISSING")
    revenue = _decimal_value(raw[1], "TOTAL_REVENUE", reasons)
    cycles = _decimal_value(raw[2], "TOTAL_CYCLES", reasons)

    if reasons or machine is None or revenue is None or cycles is None:
        return None, reasons or ["ROW_INVALID"]
    return (
        MachineTotal(
            machine=machine,
            machine_class=classify_machine(machine),
            total_revenue=revenue,
            total_cycles=cycles,
        ),
        [],
    )


def _decimal_value(value: str | None, field: str, reasons: list[str]) -> Decimal | None:
    if value is None:
        reasons.append(f"{field}_MISSING")
        return None
    try:
        result = Decimal(value.strip())
    except (InvalidOperation, ValueError):
        reasons.append(f"{field}_INVALID")
        return None
    if not result.is_finite():
        reasons.append(f"{field}_INVALID")
        return None
    return result
