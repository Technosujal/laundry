from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from app.ingestion.laundro_models import DailyPoint, MeasureUnit


@dataclass(frozen=True, slots=True)
class PeriodValue:
    period: str
    value: Decimal
    day_count: int

    def as_dict(self, unit: MeasureUnit) -> dict[str, Any]:
        return {
            "period": self.period,
            "value": _format(self.value, unit),
            "day_count": self.day_count,
        }


def _format(value: Decimal, unit: MeasureUnit) -> str:
    """Render money to two places and counts as integers, without float arithmetic."""
    if unit is MeasureUnit.CURRENCY_USD:
        return str(value.quantize(Decimal("0.01")))
    if value == value.to_integral_value():
        return str(int(value))
    return str(value)


def aggregate(points: list[DailyPoint], granularity: str) -> list[PeriodValue]:
    """Aggregate daily points by year, month, or day.

    Source days are used exactly as exported. No timezone conversion is applied, because the
    store timezone is unconfirmed and a conversion would silently move values between periods.
    """
    if granularity not in {"year", "month", "day"}:
        raise ValueError(f"Unsupported granularity: {granularity}")

    buckets: dict[str, list[DailyPoint]] = defaultdict(list)
    for point in points:
        if granularity == "year":
            key = f"{point.day.year:04d}"
        elif granularity == "month":
            key = f"{point.day.year:04d}-{point.day.month:02d}"
        else:
            key = point.day.isoformat()
        buckets[key].append(point)

    result: list[PeriodValue] = []
    for key in sorted(buckets):
        bucket = buckets[key]
        result.append(
            PeriodValue(
                period=key,
                value=sum((p.amount for p in bucket), Decimal("0")),
                day_count=len({p.day for p in bucket}),
            )
        )
    return result


def totals(points: list[DailyPoint]) -> tuple[Decimal, int, str | None, str | None]:
    if not points:
        return Decimal("0"), 0, None, None
    days = sorted({p.day for p in points})
    return (
        sum((p.amount for p in points), Decimal("0")),
        len(days),
        days[0].isoformat(),
        days[-1].isoformat(),
    )
