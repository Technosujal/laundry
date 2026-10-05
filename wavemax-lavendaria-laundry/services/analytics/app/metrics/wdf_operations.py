from __future__ import annotations

import re
from collections import Counter, defaultdict
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from app.ingestion.wdf_reports import ReportBundle
from app.metrics.wdf_sales_analytics import SalesLine

OPERATIONS_VERSION = "wdf-operations/1.0.0"

TICKET_BANDS = (
    ("<$20", Decimal("0"), Decimal("20")),
    ("$20-30", Decimal("20"), Decimal("30")),
    ("$30-40", Decimal("30"), Decimal("40")),
    ("$40-50", Decimal("40"), Decimal("50")),
    ("$50-75", Decimal("50"), Decimal("75")),
    ("$75-100", Decimal("75"), Decimal("100")),
    ("$100-150", Decimal("100"), Decimal("150")),
    ("$150+", Decimal("150"), None),
)

POUND_BANDS = (
    ("<15 lb", Decimal("0"), Decimal("15")),
    ("15-25", Decimal("15"), Decimal("25")),
    ("25-35", Decimal("25"), Decimal("35")),
    ("35-50", Decimal("35"), Decimal("50")),
    ("50-75", Decimal("50"), Decimal("75")),
    ("75-100", Decimal("75"), Decimal("100")),
    ("100+", Decimal("100"), None),
)

# Free-text void reasons are grouped by the words staff actually typed, including their
# misspellings. Anything unmatched stays in its own bucket rather than being forced into one.
REASON_GROUPS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "Customer declined or changed mind",
        ("want", "not doing", "no laundry", "no need", "no reson", "no "),
    ),
    (
        "Customer cancelled or changed order",
        ("cancl", "cancle", "cance", "chang", "cange", "change pl", "retuen", "retu"),
    ),
    ("Keying mistake", ("mistake", "misttake", "mistkake", "miskat", "instead")),
    ("Merged with another order", ("merged",)),
    ("Late", ("late",)),
    ("Only part of the order", ("only want",)),
)


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _band(value: Decimal, bands: tuple[tuple[str, Decimal, Decimal | None], ...]) -> str:
    for label, low, high in bands:
        if value >= low and (high is None or value < high):
            return label
    return bands[-1][0]


def _group_reason(reason: str) -> str:
    text = reason.lower().strip()
    if not text:
        return "No reason given"
    for label, needles in REASON_GROUPS:
        if any(needle in text for needle in needles):
            return label
    return "Other reason"


def _customer_directory(reports: ReportBundle, voids: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Every customer any supplied WDF export names, with what that export says about them.

    Three narrow sources name a customer: the Top Customers Report ranks ten, the Order List
    displays thirty of 4,319 orders, and the Void Report lists thirty corrections. The sales
    workbook itself carries no customer column, so a customer's full order history cannot be
    assembled and is not implied. Names are matched exactly and never merged: two spellings of
    one person stay two entries rather than being guessed into one.
    """
    people: dict[str, dict[str, Any]] = {}

    def entry(name: str) -> dict[str, Any]:
        return people.setdefault(
            name,
            {
                "customer": name,
                "rank": None,
                "reported_orders": None,
                "reported_sales": None,
                "average_ticket": None,
                "orders": [],
                "voids": [],
                "machine_starts": [],
                "sources": [],
            },
        )

    for row in reports.top_customers:
        name = (row.get("customer") or "").strip()
        if not name:
            continue
        person = entry(name)
        person["rank"] = row.get("rank")
        person["reported_orders"] = row.get("order_count")
        person["reported_sales"] = row.get("sales")
        person["average_ticket"] = row.get("average_ticket")
        person["sources"].append("Top Customers Report")

    for row in reports.order_list:
        name = (row.get("customer") or "").strip()
        if not name:
            continue
        person = entry(name)
        person["orders"].append(row)
        if "Order List" not in person["sources"]:
            person["sources"].append("Order List")

    for row in voids:
        name = (row.get("customer") or "").strip()
        if not name:
            continue
        person = entry(name)
        person["voids"].append(row)
        if "Void Report" not in person["sources"]:
            person["sources"].append("Void Report")

    for row in reports.machine_starts:
        name = (row.get("customer") or "").strip()
        if not name:
            continue
        person = entry(name)
        person["machine_starts"].append(row)
        if "Machine Starts" not in person["sources"]:
            person["sources"].append("Machine Starts")

    # Ranked customers first in their reported order, then everyone else alphabetically, so the
    # list has a defensible shape rather than depending on which file was read first.
    return sorted(
        people.values(),
        key=lambda person: (
            person["rank"] is None,
            person["rank"] or 0,
            person["customer"].lower(),
        ),
    )


def build_operations(lines: list[SalesLine], reports: ReportBundle) -> dict[str, Any]:
    """Build operations views from complete supplied datasets only."""
    coverage = reports.coverage

    def complete(name: str) -> bool:
        return bool(coverage.get(name, {}).get("complete"))

    # Paged extracts remain registered as source evidence, but their displayed subset must not
    # feed calculations. A complete replacement export is picked up automatically on the next run.
    reports = ReportBundle(
        top_customers=reports.top_customers if complete("top_customers") else [],
        production_employees=reports.production_employees,
        production_orders=reports.production_orders,
        tips=reports.tips,
        order_list=reports.order_list if complete("order_list") else [],
        order_list_summary=reports.order_list_summary if complete("order_list") else {},
        machine_starts=reports.machine_starts if complete("machine_starts") else [],
        machine_starts_total=reports.machine_starts_total if complete("machine_starts") else {},
        drawer_events=reports.drawer_events if complete("drawer") else [],
        shifts=reports.shifts if complete("shifts") else [],
        voids=reports.voids if complete("voids") else [],
        coverage=coverage,
        sources=reports.sources,
    )
    per_order: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"net": Decimal("0"), "pounds": Decimal("0"), "laundry": False, "paid": None}
    )
    for line in lines:
        record = per_order[line.order_number]
        record["net"] = Decimal(record["net"]) + line.subtotal
        if (line.units or "").strip().lower() == "lb":
            record["pounds"] = Decimal(record["pounds"]) + line.quantity
        if line.laundry_service:
            record["laundry"] = True
        stamp = line.paid_at.isoformat()
        if record["paid"] is None or stamp < record["paid"]:
            record["paid"] = stamp

    laundry_orders = {k: v for k, v in per_order.items() if v["laundry"]}
    laundry_nets = [Decimal(v["net"]) for v in laundry_orders.values()]
    weighed = [Decimal(v["pounds"]) for v in laundry_orders.values() if Decimal(v["pounds"]) > 0]

    ticket_bands = Counter(_band(net, TICKET_BANDS) for net in laundry_nets)
    pound_bands = Counter(_band(pounds, POUND_BANDS) for pounds in weighed)

    largest = sorted(
        (
            {
                "order_number": order,
                "paid": value["paid"],
                "net": _money(Decimal(value["net"])),
                "pounds": str(Decimal(value["pounds"])),
            }
            for order, value in laundry_orders.items()
        ),
        key=lambda row: Decimal(row["net"]),
        reverse=True,
    )[:10]

    # Void detail is grouped only when the supplied export is complete.
    voids = reports.voids
    void_total = sum((Decimal(v["amount"]) for v in voids), Decimal("0"))
    by_reason: dict[str, Decimal] = defaultdict(Decimal)
    by_void_customer: dict[str, Decimal] = defaultdict(Decimal)
    by_void_employee: dict[str, list[Any]] = defaultdict(lambda: [Decimal("0"), 0])
    by_void_month: dict[str, Decimal] = defaultdict(Decimal)
    for entry in voids:
        amount = Decimal(entry["amount"])
        by_reason[_group_reason(entry["reason"])] += amount
        if entry["customer"]:
            by_void_customer[entry["customer"]] += amount
        if entry["voided_by"]:
            bucket = by_void_employee[entry["voided_by"]]
            bucket[0] = Decimal(bucket[0]) + amount
            bucket[1] = int(bucket[1]) + 1
        if entry["when"]:
            by_void_month[entry["when"][:7]] += amount

    # Voids attributed back to the top-customer list where the names match exactly.
    top_customers = []
    for row in reports.top_customers:
        voided = by_void_customer.get(row["customer"])
        top_customers.append({**row, "voided": _money(voided) if voided else None})

    drawer_reasons = Counter(_drawer_reason(event["reason"]) for event in reports.drawer_events)

    machine_cost = sorted(
        (row for row in reports.machine_starts if row["ratio_percent"] is not None),
        key=lambda row: Decimal(row["ratio_percent"]),
        reverse=True,
    )
    pooled_starts = Decimal(reports.machine_starts_total.get("machine_starts", "0"))
    pooled_total = Decimal(reports.machine_starts_total.get("grand_total", "0"))

    named_orders = [row for row in reports.order_list if row["named"]]
    walk_in = [row for row in reports.order_list if not row["named"]]

    return {
        "operations_version": OPERATIONS_VERSION,
        "coverage": reports.coverage,
        "customers": {
            "top": top_customers,
            "top_total": _money(
                sum((Decimal(r["sales"]) for r in reports.top_customers), Decimal("0"))
            ),
            "laundry_order_count": len(laundry_orders),
            "average_laundry_ticket": _money(sum(laundry_nets, Decimal("0")) / len(laundry_nets))
            if laundry_nets
            else None,
            "median_laundry_ticket": _money(_median(laundry_nets)) if laundry_nets else None,
            "average_pounds": str(_median(weighed).quantize(Decimal("0.1"))) if weighed else None,
            "ticket_bands": [
                {"band": label, "order_count": ticket_bands.get(label, 0)}
                for label, _, _ in TICKET_BANDS
            ],
            "pound_bands": [
                {"band": label, "order_count": pound_bands.get(label, 0)}
                for label, _, _ in POUND_BANDS
            ],
            "largest_tickets": largest,
            "machine_cost": machine_cost,
            "machine_cost_pooled_percent": str(
                (pooled_starts / pooled_total * 100).quantize(Decimal("0.1"))
            )
            if pooled_total
            else None,
            "order_list_segments": [
                {
                    "segment": "Named customer",
                    "orders": len(named_orders),
                    "average_subtotal": _money(
                        sum((Decimal(r["subtotal"]) for r in named_orders), Decimal("0"))
                        / len(named_orders)
                    )
                    if named_orders
                    else None,
                },
                {
                    "segment": "Walk-in, no name recorded",
                    "orders": len(walk_in),
                    "average_subtotal": _money(
                        sum((Decimal(r["subtotal"]) for r in walk_in), Decimal("0")) / len(walk_in)
                    )
                    if walk_in
                    else None,
                },
            ],
            # The Order List's own rows, published so a reader can open one order and see the
            # status, payment method and customer the sales workbook does not carry. Only the
            # 30 rows the export displays exist; coverage says so beside them.
            "order_list": reports.order_list,
            "directory": _customer_directory(reports, voids),
        },
        "staff": {
            "production": reports.production_employees,
            "tips": reports.tips,
            "production_total": _money(
                sum((Decimal(r["processed"]) for r in reports.production_employees), Decimal("0"))
            ),
            "tips_total": _money(
                sum((Decimal(r["total_tips"]) for r in reports.tips), Decimal("0"))
            ),
        },
        "voids": {
            "entries": voids,
            "displayed_total": _money(void_total),
            "by_reason": sorted(
                ({"name": k, "amount": _money(v)} for k, v in by_reason.items()),
                key=lambda row: Decimal(row["amount"]),
                reverse=True,
            ),
            "by_customer": sorted(
                ({"name": k, "amount": _money(v)} for k, v in by_void_customer.items()),
                key=lambda row: Decimal(row["amount"]),
                reverse=True,
            )[:10],
            "by_employee": sorted(
                (
                    {"name": k, "amount": _money(Decimal(v[0])), "count": int(v[1])}
                    for k, v in by_void_employee.items()
                ),
                key=lambda row: Decimal(row["amount"]),
                reverse=True,
            ),
            "by_month": [
                {"period": k, "amount": _money(by_void_month[k])} for k in sorted(by_void_month)
            ],
        },
        "drawer": {
            "events": reports.drawer_events,
            "reasons": sorted(
                ({"name": k, "count": v} for k, v in drawer_reasons.items()),
                key=lambda row: row["count"],
                reverse=True,
            ),
        },
        "shifts": reports.shifts,
    }


def _drawer_reason(reason: str) -> str:
    text = reason.lower()
    if "shift open" in text:
        return "Shift open"
    if "shift close" in text:
        return "Shift close"
    if "paid out" in text:
        return "Cash paid out"
    if "tip" in text:
        return "Tip payout"
    if "chang" in text or "chamge" in text:
        return "Making change"
    return "Other"


def _median(values: list[Decimal]) -> Decimal:
    if not values:
        return Decimal("0")
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def build_basket(lines: list[SalesLine], limit: int = 15) -> list[dict[str, Any]]:
    """Retail item pairs that appear on the same ticket."""
    per_order: dict[str, set[str]] = defaultdict(set)
    for line in lines:
        if not line.laundry_service:
            per_order[line.order_number].add(line.item_name)

    pairs: Counter[tuple[str, str]] = Counter()
    for items in per_order.values():
        ordered = sorted(items)
        for i, first in enumerate(ordered):
            for second in ordered[i + 1 :]:
                pairs[(first, second)] += 1

    return [
        {"item_a": a, "item_b": b, "tickets": count}
        for (a, b), count in pairs.most_common(limit)
        if count > 1
    ]


def build_product_detail(lines: list[SalesLine]) -> dict[str, Any]:
    """Turnaround mix, piece-priced items, fee lines, taxability and price consistency."""
    turnaround: dict[str, dict[str, Any]] = {
        "Next day": {
            "orders": set(),
            "pounds": Decimal("0"),
            "net": Decimal("0"),
            "pound_net": Decimal("0"),
        },
        "Same day": {
            "orders": set(),
            "pounds": Decimal("0"),
            "net": Decimal("0"),
            "pound_net": Decimal("0"),
        },
    }
    bedding: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"quantity": Decimal("0"), "net": Decimal("0")}
    )
    fees: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"count": 0, "net": Decimal("0"), "quantity": Decimal("0")}
    )
    non_taxable: dict[str, dict[str, Any]] = defaultdict(lambda: {"lines": 0, "net": Decimal("0")})
    prices: dict[str, Counter[str]] = defaultdict(Counter)

    for line in lines:
        name = line.item_name
        lowered = name.lower()

        if "next day" in lowered or "same day" in lowered:
            key = "Same day" if "same day" in lowered else "Next day"
            bucket = turnaround[key]
            bucket["orders"].add(line.order_number)
            bucket["net"] = Decimal(bucket["net"]) + line.subtotal
            if (line.units or "").strip().lower() == "lb":
                bucket["pounds"] = Decimal(bucket["pounds"]) + line.quantity
                bucket["pound_net"] = Decimal(bucket["pound_net"]) + line.subtotal

        if line.department == "Bedding":
            entry = bedding[name]
            entry["quantity"] = Decimal(entry["quantity"]) + line.quantity
            entry["net"] = Decimal(entry["net"]) + line.subtotal

        if any(
            word in lowered
            for word in ("service charge", "minimum", "off", "refund", "folding service")
        ):
            entry = fees[name]
            entry["count"] = int(entry["count"]) + 1
            entry["net"] = Decimal(entry["net"]) + line.subtotal
            entry["quantity"] = Decimal(entry["quantity"]) + line.quantity

        if line.tax == 0 and line.subtotal != 0:
            entry = non_taxable[name]
            entry["lines"] = int(entry["lines"]) + 1
            entry["net"] = Decimal(entry["net"]) + line.subtotal

        if line.quantity > 0 and line.subtotal > 0:
            unit = (line.subtotal / line.quantity).quantize(Decimal("0.01"))
            prices[name][str(unit)] += 1

    inconsistent: list[dict[str, Any]] = [
        {
            "name": name,
            "lowest": _money(min(Decimal(p) for p in counts)),
            "highest": _money(max(Decimal(p) for p in counts)),
            "distinct_prices": len(counts),
            "lines": sum(counts.values()),
        }
        for name, counts in prices.items()
        if len(counts) > 1
    ]

    return {
        "turnaround": [
            {
                "name": key,
                "order_count": len(value["orders"]),
                "pounds": str(Decimal(value["pounds"])),
                "net": _money(Decimal(value["net"])),
                "rate_per_pound": _money(Decimal(value["pound_net"]) / Decimal(value["pounds"]))
                if Decimal(value["pounds"]) > 0
                else None,
            }
            for key, value in turnaround.items()
            if value["orders"]
        ],
        "bedding": sorted(
            (
                {
                    "name": name,
                    "quantity": str(Decimal(v["quantity"])),
                    "net": _money(Decimal(v["net"])),
                    "each": _money(Decimal(v["net"]) / Decimal(v["quantity"]))
                    if Decimal(v["quantity"]) > 0
                    else None,
                }
                for name, v in bedding.items()
            ),
            key=lambda row: Decimal(row["net"]),
            reverse=True,
        ),
        "fees": sorted(
            (
                {
                    "name": name,
                    "count": int(v["count"]),
                    "net": _money(Decimal(v["net"])),
                }
                for name, v in fees.items()
            ),
            key=lambda row: abs(Decimal(row["net"])),
            reverse=True,
        ),
        "non_taxable": sorted(
            (
                {"name": name, "lines": int(v["lines"]), "net": _money(Decimal(v["net"]))}
                for name, v in non_taxable.items()
            ),
            key=lambda row: Decimal(str(row["net"])),
            reverse=True,
        )[:14],
        "price_consistency": sorted(
            inconsistent,
            key=lambda row: int(row["lines"]),
            reverse=True,
        ),
    }


def build_every_item(lines: list[SalesLine]) -> list[dict[str, Any]]:
    """One row per item, the exact-record table behind the product rankings."""
    items: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "quantity": Decimal("0"),
            "net": Decimal("0"),
            "tax": Decimal("0"),
            "lines": 0,
            "orders": set(),
            "department": "",
            "units": "",
        }
    )
    total = Decimal("0")
    for line in lines:
        entry = items[line.item_name]
        entry["quantity"] = Decimal(entry["quantity"]) + line.quantity
        entry["net"] = Decimal(entry["net"]) + line.subtotal
        entry["tax"] = Decimal(entry["tax"]) + line.tax
        entry["lines"] = int(entry["lines"]) + 1
        entry["orders"].add(line.order_number)
        entry["department"] = line.department
        if line.units:
            entry["units"] = line.units
        total += line.subtotal

    rows = []
    for name, entry in items.items():
        net = Decimal(entry["net"])
        quantity = Decimal(entry["quantity"])
        rows.append(
            {
                "name": name,
                "department": entry["department"],
                "units": entry["units"] or "",
                "quantity": str(quantity),
                "net": _money(net),
                "share": str((net / total * 100).quantize(Decimal("0.1"))) if total else "0.0",
                "lines": int(entry["lines"]),
                "orders": len(entry["orders"]),
                "average_price": _money(net / quantity) if quantity > 0 else None,
                "tax": _money(Decimal(entry["tax"])),
            }
        )
    return sorted(rows, key=lambda row: Decimal(row["net"]), reverse=True)


def normalise_order_number(value: str) -> str:
    return re.sub(r"[^0-9]", "", value or "")
