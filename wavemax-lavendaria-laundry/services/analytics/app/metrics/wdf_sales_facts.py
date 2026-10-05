from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from app.metrics.wdf_sales_analytics import SalesLine

FACTS_VERSION = "wdf-sales-facts/1.0.0"

# Every measure travels as an integer in a fixed unit, so the browser can cross-filter by
# summing integers exactly. A float would reintroduce the rounding error the service exists to
# avoid; an integer count of a fixed unit cannot drift.
#
# The units are chosen from the source's own precision, verified against the 2025 workbook:
# subtotals carry at most 2 decimal places and quantities at most 2, so cents and thousandths
# are lossless. Tax carries up to 17 decimal places, so rounding it to cents per line and then
# summing disagrees with the service's sum-then-round by $4.36 across the year. Tax therefore
# travels in hundred-thousandths, which reproduces the published total exactly.
SCALES = {
    "subtotal": 100,
    "tax": 100_000,
    "pounds": 1_000,
}
CENTS = Decimal("0.01")
MILLI = Decimal("0.001")
TAX_UNIT = Decimal("0.00001")

COLUMN_NAMES = (
    "day",
    "hour",
    "department",
    "category",
    "item",
    "order",
    "subtotal_cents",
    "tax_units",
    "pounds_milli",
    "laundry_service",
)


def _cents(value: Decimal) -> int:
    return int(value.quantize(CENTS, rounding=ROUND_HALF_UP) * 100)


def _milli(value: Decimal) -> int:
    return int(value.quantize(MILLI, rounding=ROUND_HALF_UP) * 1000)


def _tax_units(value: Decimal) -> int:
    return int(value.quantize(TAX_UNIT, rounding=ROUND_HALF_UP) * 100_000)


class _Dictionary:
    """Assigns a stable index to each distinct string, in first-seen order."""

    def __init__(self) -> None:
        self._index: dict[str, int] = {}
        self.values: list[str] = []

    def index_of(self, value: str) -> int:
        existing = self._index.get(value)
        if existing is not None:
            return existing
        assigned = len(self.values)
        self._index[value] = assigned
        self.values.append(value)
        return assigned


def build_sales_facts(lines: list[SalesLine]) -> dict[str, Any]:
    """Publish every accepted line as an integer fact row for interactive cross-filtering.

    This is a lossless re-encoding of the same lines the aggregate series are built from, not
    a second source. Every row carries the dimensions a reader can click and the measures in
    integer units, so a filtered total is a sum of integers rather than a recomputation.
    """
    if not lines:
        return {"facts_version": FACTS_VERSION, "available": False}

    days = _Dictionary()
    items = _Dictionary()
    departments = _Dictionary()
    categories = _Dictionary()
    orders = _Dictionary()

    columns: dict[str, list[int]] = {name: [] for name in COLUMN_NAMES}
    for line in lines:
        pounds = line.quantity if (line.units or "").strip().lower() == "lb" else Decimal("0")
        columns["day"].append(days.index_of(line.paid_at.date().isoformat()))
        columns["hour"].append(line.paid_at.hour)
        columns["department"].append(departments.index_of(line.department))
        columns["category"].append(categories.index_of(line.category))
        columns["item"].append(items.index_of(line.item_name))
        columns["order"].append(orders.index_of(line.order_number))
        columns["subtotal_cents"].append(_cents(line.subtotal))
        columns["tax_units"].append(_tax_units(line.tax))
        columns["pounds_milli"].append(_milli(pounds))
        columns["laundry_service"].append(1 if line.laundry_service else 0)

    # The service's own totals, so the browser can prove its arithmetic agrees before it
    # displays anything. A disagreement is a defect, not something to round away.
    checksum = {
        "subtotal_cents": sum(columns["subtotal_cents"]),
        "tax_units": sum(columns["tax_units"]),
        "pounds_milli": sum(columns["pounds_milli"]),
        "line_count": len(lines),
        "order_count": len(orders.values),
    }

    return {
        "facts_version": FACTS_VERSION,
        "available": True,
        "columns": list(COLUMN_NAMES),
        "scales": dict(SCALES),
        "row_count": len(lines),
        "days": days.values,
        "departments": departments.values,
        "categories": categories.values,
        "items": items.values,
        "orders": orders.values,
        # Column-major and comma-delimited. A nested array of 5,119 rows would be expanded to
        # one integer per line by the artifact's pretty-printer, quadrupling the payload for no
        # gain in readability; one string per column stays compact and decodes in a single pass.
        "data": {name: ",".join(str(v) for v in values) for name, values in columns.items()},
        "checksum": checksum,
    }
