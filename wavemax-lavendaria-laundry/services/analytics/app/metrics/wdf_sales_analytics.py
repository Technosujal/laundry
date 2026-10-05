from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

ANALYTICS_VERSION = "wdf-sales-analytics/1.0.0"
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _num(value: Decimal) -> str:
    if value == value.to_integral_value():
        return str(int(value))
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


@dataclass(slots=True)
class SalesLine:
    """One accepted workbook line, reduced to the fields the dashboards use."""

    paid_at: datetime
    order_number: str
    category: str
    department: str
    item_name: str
    quantity: Decimal
    units: str | None
    subtotal: Decimal
    tax: Decimal
    laundry_service: bool


@dataclass(slots=True)
class _Bucket:
    subtotal: Decimal = Decimal("0")
    tax: Decimal = Decimal("0")
    lines: int = 0
    orders: set[str] | None = None
    pounds: Decimal = Decimal("0")

    def add(self, line: SalesLine) -> None:
        if self.orders is None:
            self.orders = set()
        self.subtotal += line.subtotal
        self.tax += line.tax
        self.lines += 1
        self.orders.add(line.order_number)
        if (line.units or "").strip().lower() == "lb":
            self.pounds += line.quantity

    def as_dict(self, key_name: str, key: Any) -> dict[str, Any]:
        orders = len(self.orders or set())
        return {
            key_name: key,
            "subtotal": _money(self.subtotal),
            "tax": _money(self.tax),
            "line_count": self.lines,
            "order_count": orders,
            "pounds": _num(self.pounds),
            "average_ticket": _money(self.subtotal / orders) if orders else None,
        }


def _bucketed(lines: list[SalesLine], key: Callable[[SalesLine], Any]) -> dict[Any, _Bucket]:
    buckets: dict[Any, _Bucket] = defaultdict(_Bucket)
    for line in lines:
        buckets[key(line)].add(line)
    return buckets


def _iso_week(value: date) -> str:
    year, week, _ = value.isocalendar()
    return f"{year:04d}-W{week:02d}"


def build_sales_analytics(lines: list[SalesLine]) -> dict[str, Any]:
    """Build every WDF-derived dashboard series.

    Every published series is aggregated here with exact decimal arithmetic. The browser
    re-totals only when a reader cross-filters, and then only by summing the integer line
    values published alongside these series in `build_sales_facts`, which reproduce these
    totals exactly.
    Source timestamps are used exactly as exported; no timezone conversion is applied,
    because the store timezone is unconfirmed and a conversion would move values between
    periods.
    """
    if not lines:
        return {"analytics_version": ANALYTICS_VERSION, "available": False}

    total_subtotal = sum((line.subtotal for line in lines), Decimal("0"))
    total_tax = sum((line.tax for line in lines), Decimal("0"))
    total_pounds = sum(
        (line.quantity for line in lines if (line.units or "").strip().lower() == "lb"),
        Decimal("0"),
    )
    orders = {line.order_number for line in lines}
    days = sorted({line.paid_at.date() for line in lines})

    by_month = _bucketed(lines, lambda line: f"{line.paid_at.year:04d}-{line.paid_at.month:02d}")
    by_day = _bucketed(lines, lambda line: line.paid_at.date().isoformat())
    by_week = _bucketed(lines, lambda line: _iso_week(line.paid_at.date()))
    by_weekday = _bucketed(lines, lambda line: line.paid_at.weekday())
    by_hour = _bucketed(lines, lambda line: line.paid_at.hour)
    by_department = _bucketed(lines, lambda line: line.department)
    by_category = _bucketed(lines, lambda line: line.category)
    by_item = _bucketed(lines, lambda line: line.item_name)
    by_service = _bucketed(
        lines, lambda line: "Laundry service" if line.laundry_service else "Retail"
    )
    order_flags: dict[str, set[bool]] = defaultdict(set)
    for line in lines:
        order_flags[line.order_number].add(line.laundry_service)
    order_type = {
        order: "Both" if len(flags) > 1 else "Laundry only" if True in flags else "Retail only"
        for order, flags in order_flags.items()
    }
    by_order_type = _bucketed(lines, lambda line: order_type[line.order_number])

    months = [by_month[k].as_dict("period", k) for k in sorted(by_month)]
    daily = [by_day[k].as_dict("period", k) for k in sorted(by_day)]

    # Trailing seven-day average of daily net sales, over open days only.
    trailing: list[dict[str, Any]] = []
    window: list[Decimal] = []
    for point in daily:
        window.append(Decimal(point["subtotal"]))
        if len(window) > 7:
            window.pop(0)
        trailing.append(
            {
                "period": point["period"],
                "subtotal": point["subtotal"],
                "trailing_average": _money(sum(window, Decimal("0")) / Decimal(len(window))),
            }
        )

    # Month-over-month change, expressed only where a prior month exists.
    momentum: list[dict[str, Any]] = []
    for index, row in enumerate(months):
        if index == 0:
            momentum.append({"period": row["period"], "subtotal": row["subtotal"], "change": None})
            continue
        previous = Decimal(months[index - 1]["subtotal"])
        current = Decimal(row["subtotal"])
        change = None if previous == 0 else _money((current - previous) / previous * Decimal(100))
        momentum.append({"period": row["period"], "subtotal": row["subtotal"], "change": change})

    # Weekday-by-hour activity, as order counts rather than money, so a single large ticket
    # cannot masquerade as a busy hour.
    heat: dict[tuple[int, int], set[str]] = defaultdict(set)
    for line in lines:
        heat[(line.paid_at.weekday(), line.paid_at.hour)].add(line.order_number)
    heatmap = [
        {"weekday": weekday, "hour": hour, "order_count": len(heat.get((weekday, hour), set()))}
        for weekday in range(7)
        for hour in range(24)
    ]

    ranked_days = sorted(daily, key=lambda row: Decimal(row["subtotal"]), reverse=True)
    per_pound = [
        by_item[name].as_dict("name", name) for name in by_item if by_item[name].pounds > 0
    ]

    return {
        "analytics_version": ANALYTICS_VERSION,
        "available": True,
        "totals": {
            "net_sales": _money(total_subtotal),
            "tax": _money(total_tax),
            "pounds": _num(total_pounds),
            "order_count": len(orders),
            "line_count": len(lines),
            "open_days": len(days),
            "average_ticket": _money(total_subtotal / len(orders)) if orders else None,
            "average_day": _money(total_subtotal / len(days)) if days else None,
            "first_day": days[0].isoformat(),
            "last_day": days[-1].isoformat(),
        },
        "by_month": months,
        "by_week": [by_week[k].as_dict("period", k) for k in sorted(by_week)],
        "by_day": daily,
        "trailing": trailing,
        "momentum": momentum,
        "by_weekday": [
            {**by_weekday[i].as_dict("weekday", WEEKDAYS[i]), "weekday_index": i}
            for i in sorted(by_weekday)
        ],
        "by_hour": [by_hour[h].as_dict("hour", h) for h in sorted(by_hour)],
        "heatmap": heatmap,
        "by_department": sorted(
            (by_department[k].as_dict("name", k) for k in by_department),
            key=lambda row: Decimal(row["subtotal"]),
            reverse=True,
        ),
        "by_category": sorted(
            (by_category[k].as_dict("name", k) for k in by_category),
            key=lambda row: Decimal(row["subtotal"]),
            reverse=True,
        ),
        "by_service_type": sorted(
            (by_service[k].as_dict("name", k) for k in by_service),
            key=lambda row: Decimal(row["subtotal"]),
            reverse=True,
        ),
        "by_order_type": sorted(
            (by_order_type[k].as_dict("name", k) for k in by_order_type),
            key=lambda row: row["order_count"],
            reverse=True,
        ),
        "top_items_by_value": sorted(
            (by_item[k].as_dict("name", k) for k in by_item),
            key=lambda row: Decimal(row["subtotal"]),
            reverse=True,
        )[:15],
        "top_items_by_volume": sorted(
            (
                {**by_item[k].as_dict("name", k), "units_sold": _num(by_item[k].pounds)}
                for k in by_item
            ),
            key=lambda row: row["line_count"],
            reverse=True,
        )[:15],
        "per_pound_services": sorted(
            per_pound, key=lambda row: Decimal(row["pounds"]), reverse=True
        )[:12],
        "best_days": ranked_days[:10],
        "slowest_days": list(reversed(ranked_days[-10:])),
    }
