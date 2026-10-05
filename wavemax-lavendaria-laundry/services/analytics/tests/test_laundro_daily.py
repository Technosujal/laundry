from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from app.ingestion.laundro_daily import (
    DAILY_SERIES,
    SERIES_BY_ID,
    LaundroSchemaError,
    parse_daily_series,
)
from app.ingestion.laundro_models import DailyPoint, MachineScope, MeasureUnit
from app.ingestion.models import OutcomeStatus
from app.metrics.aggregate import aggregate, totals

SPEC = SERIES_BY_ID["machine_revenue"]
COUNT_SPEC = SERIES_BY_ID["washer_cycles"]


def write_csv(tmp_path: Path, body: str, name: str = "series.csv") -> Path:
    path = tmp_path / name
    path.write_text(body, encoding="utf-8", newline="")
    return path


def outcomes_for(path: Path, spec=SPEC):
    return list(parse_daily_series(path, spec=spec, source_sha256="a" * 64))


def test_parses_valid_rows(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,10.50\n2025-01-02,20.25\n")
    results = outcomes_for(path)
    assert [r.status for r in results] == [OutcomeStatus.ACCEPTED] * 2
    assert results[0].parsed == DailyPoint(day=date(2025, 1, 1), amount=Decimal("10.50"))


def test_rejects_wrong_headers(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Date,Value\n2025-01-01,1\n")
    with pytest.raises(LaundroSchemaError):
        outcomes_for(path)


def test_rejects_empty_file(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "")
    with pytest.raises(LaundroSchemaError):
        outcomes_for(path)


def test_quarantines_invalid_day_and_amount(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\nnot-a-date,5\n2025-01-01,not-a-number\n")
    results = outcomes_for(path)
    assert all(r.status is OutcomeStatus.QUARANTINED for r in results)
    assert "DAY_INVALID" in results[0].reason_codes
    assert "AMOUNT_INVALID" in results[1].reason_codes
    assert all(r.parsed is None for r in results)


def test_row_accounting_holds_for_mixed_input(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,1\nbad,2\n2025-01-03,3\n")
    results = outcomes_for(path)
    accepted = [r for r in results if r.status is OutcomeStatus.ACCEPTED]
    quarantined = [r for r in results if r.status is OutcomeStatus.QUARANTINED]
    assert len(results) == len(accepted) + len(quarantined)


def test_flags_duplicate_day_without_discarding(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,1\n2025-01-01,2\n")
    results = outcomes_for(path)
    assert all(r.status is OutcomeStatus.ACCEPTED for r in results)
    assert "DUPLICATE_DAY" in results[1].warning_codes
    assert results[1].parsed is not None


def test_flags_negative_and_zero_amounts(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,-5\n2025-01-02,0\n")
    results = outcomes_for(path)
    assert "NEGATIVE_AMOUNT" in results[0].warning_codes
    assert "ZERO_AMOUNT" in results[1].warning_codes


def test_flags_non_integer_count_for_count_series(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,3.5\n")
    results = outcomes_for(path, spec=COUNT_SPEC)
    assert "NON_INTEGER_COUNT" in results[0].warning_codes


def test_row_identity_is_deterministic_and_unique(tmp_path: Path) -> None:
    path = write_csv(tmp_path, "Day,Amount\n2025-01-01,1\n2025-01-02,2\n")
    first = outcomes_for(path)
    second = outcomes_for(path)
    assert [r.source_row_identity for r in first] == [r.source_row_identity for r in second]
    assert len({r.source_row_identity for r in first}) == 2


def test_aggregation_by_period(tmp_path: Path) -> None:
    path = write_csv(
        tmp_path,
        "Day,Amount\n2025-01-01,10\n2025-01-31,5\n2025-02-01,2\n2026-01-01,1\n",
    )
    points = [r.parsed for r in outcomes_for(path) if r.parsed is not None]
    by_year = {p.period: p.value for p in aggregate(points, "year")}
    by_month = {p.period: p.value for p in aggregate(points, "month")}
    assert by_year == {"2025": Decimal("17"), "2026": Decimal("1")}
    assert by_month["2025-01"] == Decimal("15")
    assert by_month["2025-02"] == Decimal("2")
    total, days, first, last = totals(points)
    assert (total, days, first, last) == (Decimal("18"), 4, "2025-01-01", "2026-01-01")


def test_every_series_spec_declares_scope_and_coverage() -> None:
    for spec in DAILY_SERIES:
        assert spec.coverage_note.strip(), spec.series_id
        assert spec.business_event.strip(), spec.series_id
        assert isinstance(spec.unit, MeasureUnit)
        assert isinstance(spec.machine_scope, MachineScope)


def test_washer_cycles_is_marked_washers_only() -> None:
    assert SERIES_BY_ID["washer_cycles"].machine_scope is MachineScope.WASHERS_ONLY
    assert SERIES_BY_ID["machine_revenue"].machine_scope is MachineScope.ALL_MACHINES
