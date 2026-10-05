from __future__ import annotations

import csv
import re
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from app.ingestion.fingerprint import fingerprint_file

PARSER_VERSION = "wdf-reports/1.0.0"
RULE_VERSION = "wdf-reports-quality/1.0.0"

TOP_CUSTOMERS = "Top Customers Report 2025-01-01 to 2025-12-31.csv"
PRODUCTION = "Production Report 2025-01-01 to 2025-12-31.csv"
ORDER_LIST = "Order List from 2025-01-01 to 2025-12-31.csv"
TIPS = "Credit Card Tips Report 2025-01-01 to 2025-12-31.csv"
MACHINE_STARTS = "Machine Starts 2025-01-01 to 2025-12-31.csv"
OPEN_DRAWER = "Open Drawer Report 2025-01-01 to 2025-12-31.csv"
SHIFTS = "Shift Report 2025-01-01 to 2025-12-31.csv"
VOIDS_PDF = "Void Report 2025-01-01 to 2025-12-31.pdf"


def money(value: str | None) -> Decimal:
    if not value:
        return Decimal("0")
    cleaned = str(value).replace("$", "").replace(",", "").strip()
    if not cleaned or cleaned in {"-", "N/A"}:
        return Decimal("0")
    negative = cleaned.startswith("(") and cleaned.endswith(")")
    if negative:
        cleaned = cleaned[1:-1]
    try:
        result = Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return Decimal("0")
    return -result if negative else result


def _rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


@dataclass(slots=True)
class Coverage:
    """How much of a report the supplied export actually shows."""

    displayed: int
    reported: int | None

    @property
    def complete(self) -> bool:
        return self.reported is None or self.displayed >= self.reported

    def as_dict(self) -> dict[str, Any]:
        return {
            "displayed": self.displayed,
            "reported": self.reported,
            "complete": self.complete,
            "note": (
                "Complete export."
                if self.complete
                else f"The export displays {self.displayed} of {self.reported} entries."
            ),
        }


@dataclass(slots=True)
class ReportBundle:
    top_customers: list[dict[str, Any]] = field(default_factory=list)
    production_employees: list[dict[str, Any]] = field(default_factory=list)
    production_orders: list[dict[str, Any]] = field(default_factory=list)
    tips: list[dict[str, Any]] = field(default_factory=list)
    order_list: list[dict[str, Any]] = field(default_factory=list)
    order_list_summary: dict[str, str] = field(default_factory=dict)
    machine_starts: list[dict[str, Any]] = field(default_factory=list)
    machine_starts_total: dict[str, str] = field(default_factory=dict)
    drawer_events: list[dict[str, Any]] = field(default_factory=list)
    shifts: list[dict[str, Any]] = field(default_factory=list)
    voids: list[dict[str, Any]] = field(default_factory=list)
    coverage: dict[str, dict[str, Any]] = field(default_factory=dict)
    # Every file this bundle actually read, fingerprinted. Without this the product can only
    # name the two files registered elsewhere, and a reader cannot see that nine further WDF
    # reports stand behind the operations figures.
    sources: list[dict[str, Any]] = field(default_factory=list)


def parse_top_customers(path: Path) -> list[dict[str, Any]]:
    out = []
    for row in _rows(path):
        if row.get("record_type") != "customer":
            continue
        orders = int(row.get("order_count") or 0)
        sales = money(row.get("sales_total"))
        out.append(
            {
                "rank": int(row.get("rank") or 0),
                "customer": (row.get("customer") or "").strip(),
                "order_count": orders,
                "sales": str(sales.quantize(Decimal("0.01"))),
                "average_ticket": str((sales / orders).quantize(Decimal("0.01")))
                if orders
                else None,
            }
        )
    return sorted(out, key=lambda r: r["rank"])


def parse_production(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    employees: list[dict[str, Any]] = []
    orders: list[dict[str, Any]] = []
    for row in _rows(path):
        kind = row.get("record_type")
        if kind == "employee_summary":
            employees.append(
                {
                    "employee": (row.get("employee_name") or "").strip(),
                    "order_count": int(row.get("order_count") or 0),
                    "processed": str(money(row.get("processed_amount")).quantize(Decimal("0.01"))),
                    "pounds": str(money(row.get("pounds"))),
                    "pieces": str(money(row.get("pieces"))),
                }
            )
        elif kind == "order":
            number = re.sub(r"[^0-9]", "", row.get("order_number") or "")
            if not number:
                continue
            orders.append(
                {
                    "order_number": number,
                    "employee": (row.get("employee_name") or "").strip(),
                    "amount": str(money(row.get("order_amount")).quantize(Decimal("0.01"))),
                    "pounds": str(money(row.get("pounds"))),
                    "pieces": str(money(row.get("pieces"))),
                    "tip": str(money(row.get("tip_amount")).quantize(Decimal("0.01"))),
                    "credit_percent": (row.get("production_credit_percent") or "").strip(),
                }
            )
    return sorted(employees, key=lambda r: Decimal(r["processed"]), reverse=True), orders


def parse_tips(path: Path) -> list[dict[str, Any]]:
    out = []
    for row in _rows(path):
        if row.get("record_type") != "employee":
            continue
        out.append(
            {
                "employee": (row.get("employee_name") or "").strip(),
                "production_tips": str(money(row.get("production_tips")).quantize(Decimal("0.01"))),
                "cashier_tips": str(money(row.get("cashier_tips")).quantize(Decimal("0.01"))),
                "total_tips": str(money(row.get("total_tips")).quantize(Decimal("0.01"))),
            }
        )
    return sorted(out, key=lambda r: Decimal(r["total_tips"]), reverse=True)


def parse_order_list(path: Path) -> tuple[list[dict[str, Any]], dict[str, str], Coverage]:
    detail: list[dict[str, Any]] = []
    summary: dict[str, str] = {}
    reported = None
    displayed = 0
    for row in _rows(path):
        reported = reported or (
            int(row["reported_total_entries"]) if row.get("reported_total_entries") else None
        )
        displayed = displayed or (
            int(row["displayed_entries"]) if row.get("displayed_entries") else 0
        )
        kind = row.get("record_type")
        if kind == "detail":
            customer = (row.get("customer") or "").strip()
            # The export packs "Name, phone" into one field. Keep the name, drop the number.
            name = customer.split(",")[0].strip() if customer else ""
            detail.append(
                {
                    "order_number": re.sub(r"[^0-9]", "", row.get("order_number") or ""),
                    "customer": name,
                    "named": bool(name),
                    "created": (row.get("created_date_time") or "").strip(),
                    "order_status": (row.get("order_status") or "").strip(),
                    "payment_status": (row.get("payment_status") or "").strip(),
                    "payment_method": (row.get("payment_method") or "").strip(),
                    "subtotal": str(money(row.get("subtotal")).quantize(Decimal("0.01"))),
                    "tax": str(money(row.get("tax")).quantize(Decimal("0.01"))),
                    "total": str(money(row.get("total")).quantize(Decimal("0.01"))),
                }
            )
        elif kind in {"summary", "financial_total", "payment_type"}:
            metric = (row.get("summary_metric") or "").strip()
            if metric:
                summary[metric] = str(money(row.get("summary_value")).quantize(Decimal("0.01")))
    return detail, summary, Coverage(displayed=len(detail) or displayed, reported=reported)


def parse_machine_starts(path: Path) -> tuple[list[dict[str, Any]], dict[str, str], Coverage]:
    detail: list[dict[str, Any]] = []
    total: dict[str, str] = {}
    reported = None
    for row in _rows(path):
        reported = reported or (
            int(row["reported_total_entries"]) if row.get("reported_total_entries") else None
        )
        if row.get("record_type") == "detail":
            customer = (row.get("customer") or "").strip()
            starts = money(row.get("machine_starts"))
            grand = money(row.get("grand_total"))
            detail.append(
                {
                    "order_number": re.sub(r"[^0-9]", "", row.get("order_number") or ""),
                    "customer": customer.split(",")[0].strip(),
                    "machine_starts": str(starts.quantize(Decimal("0.01"))),
                    "order_total": str(grand.quantize(Decimal("0.01"))),
                    "ratio_percent": str((starts / grand * 100).quantize(Decimal("0.1")))
                    if grand
                    else None,
                }
            )
        elif row.get("record_type") == "total":
            total = {
                "machine_starts": str(money(row.get("machine_starts")).quantize(Decimal("0.01"))),
                "grand_total": str(money(row.get("grand_total")).quantize(Decimal("0.01"))),
                "ratio_percent": (row.get("ratio_percent") or "").strip(),
            }
    return detail, total, Coverage(displayed=len(detail), reported=reported)


def parse_drawer(path: Path) -> tuple[list[dict[str, Any]], Coverage]:
    detail = []
    reported = None
    for row in _rows(path):
        reported = reported or (
            int(row["reported_total_entries"]) if row.get("reported_total_entries") else None
        )
        if row.get("record_type") != "detail":
            continue
        detail.append(
            {
                "employee": (row.get("employee") or "").strip(),
                "when": (row.get("date_time") or "").strip(),
                "reason": (row.get("reason_for_opening_drawer") or "").strip(),
            }
        )
    return detail, Coverage(displayed=len(detail), reported=reported)


def parse_shifts(path: Path) -> tuple[list[dict[str, Any]], Coverage]:
    detail = []
    reported = None
    for row in _rows(path):
        reported = reported or (
            int(row["reported_total_entries"]) if row.get("reported_total_entries") else None
        )
        if row.get("record_type") != "shift":
            continue
        detail.append(
            {
                "opened": (row.get("opened") or "").strip(),
                "closed_by": (row.get("closed_by") or "").strip(),
                "net_sales": str(money(row.get("net_sales")).quantize(Decimal("0.01"))),
                "paid_out": str(money(row.get("paid_out")).quantize(Decimal("0.01"))),
                "cash_difference": str(money(row.get("cash_difference")).quantize(Decimal("0.01"))),
            }
        )
    return detail, Coverage(displayed=len(detail), reported=reported)


_VOID_ROW = re.compile(
    r"(?P<order>\d{4,6})\s+\$(?P<amount>[\d,]+\.\d{2})\s+(?P<rest>.+?)(?=(?:\d{4,6}\s+\$)|$)",
    re.S,
)
_DATE = re.compile(r"(\d{1,2}/\d{1,2}/\d{2}\s+\d{1,2}:\d{2}\s*[AP]M)")


def parse_voids(path: Path, known_employees: list[str]) -> tuple[list[dict[str, Any]], Coverage]:
    """Read the void report from its PDF, the only form in which it was supplied.

    Each displayed entry carries an order number, amount, date, customer, the employee who
    marked it, and a free-text reason. The employee is identified using the staff names the
    other WDF exports already establish, so the split is evidence-based rather than guessed.
    Entries the report does not display cannot be recovered.
    """
    from pypdf import PdfReader

    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(path)).pages)
    reported = None
    match = re.search(r"(\d+)\s+entries\s+\(displaying\s+(\d+)\)", text)
    if match:
        reported = int(match.group(1))

    # Strip the report's own chrome. Left in place it is absorbed into the final entry's
    # free-text reason and corrupts the order number that precedes it.
    for noise in (
        # The column header is extracted with inconsistent spacing and in varying field order,
        # so each label is removed individually rather than as one fixed phrase.
        r"Order\s*#",
        r"Grand\s*Total",
        r"Date\s*Voided",
        r"Marked\s*Voided",
        r"Reason\s*for\s*Void",
        r"\bCustomer\b",
        r"\d+\s+entries\s+\(displaying\s+\d+\)",
        r"Void Report",
        r"Wed \d{1,2}/\d{1,2}/\d{2} [\d:]+ [AP]M\s*[–-]\s*Wed \d{1,2}/\d{1,2}/\d{2} [\d:]+ [AP]M",
        r"WaveMAX Laundry[^\n]*",
        r"All Stores",
        r"All Employees",
        r"Generated [^\n]*",
        r"\d+\s*/\s*\d+\s*$",
    ):
        text = re.sub(noise, " ", text)

    # Longest names first so "Praduman Tickoo" is not swallowed by "Tickoo".
    staff = sorted({name for name in known_employees if name}, key=len, reverse=True)

    entries: list[dict[str, Any]] = []
    for row in _VOID_ROW.finditer(text.replace("\n", " ")):
        rest = " ".join(row.group("rest").split())
        when = _DATE.search(rest)
        stamp = when.group(1) if when else ""
        remainder = " ".join((rest.replace(stamp, " ") if stamp else rest).split())

        voided_by = next((name for name in staff if name in remainder), None)
        customer = ""
        reason = remainder
        if voided_by:
            head, _, tail = remainder.partition(voided_by)
            customer = head.strip(" ,")
            reason = tail.strip()

        entries.append(
            {
                "order_number": row.group("order"),
                "amount": str(money(row.group("amount")).quantize(Decimal("0.01"))),
                "when": _normalise_stamp(stamp),
                "customer": customer,
                "voided_by": voided_by or "",
                "reason": reason,
            }
        )
    return entries, Coverage(displayed=len(entries), reported=reported)


def _normalise_stamp(value: str) -> str | None:
    if not value:
        return None
    try:
        return datetime.strptime(" ".join(value.split()), "%m/%d/%y %I:%M %p").isoformat()
    except ValueError:
        return None


def _register(bundle: ReportBundle, path: Path, feeds: str) -> None:
    """Record a file the bundle read, with the fingerprint that proves which bytes were used."""
    fp = fingerprint_file(path)
    bundle.sources.append(
        {
            "source_system": "WDF_POS",
            "file": path.name,
            "sha256": fp.sha256,
            "size_bytes": fp.size_bytes,
            "parser_version": PARSER_VERSION,
            "rule_version": RULE_VERSION,
            "feeds": feeds,
        }
    )


def load_reports(wdf_dir: Path) -> ReportBundle:
    bundle = ReportBundle()

    top = wdf_dir / TOP_CUSTOMERS
    if top.is_file():
        _register(bundle, top, "Top customers")
        bundle.top_customers = parse_top_customers(top)
        bundle.coverage["top_customers"] = Coverage(
            displayed=len(bundle.top_customers), reported=None
        ).as_dict()

    production = wdf_dir / PRODUCTION
    if production.is_file():
        _register(bundle, production, "Employee production and pounds")
        bundle.production_employees, bundle.production_orders = parse_production(production)

    tips = wdf_dir / TIPS
    if tips.is_file():
        _register(bundle, tips, "Credit card tips by employee")
        bundle.tips = parse_tips(tips)

    orders = wdf_dir / ORDER_LIST
    if orders.is_file():
        _register(bundle, orders, "Order list sample, customers and statuses")
        bundle.order_list, bundle.order_list_summary, coverage = parse_order_list(orders)
        bundle.coverage["order_list"] = coverage.as_dict()

    starts = wdf_dir / MACHINE_STARTS
    if starts.is_file():
        _register(bundle, starts, "Machine starts bought for customers")
        bundle.machine_starts, bundle.machine_starts_total, coverage = parse_machine_starts(starts)
        bundle.coverage["machine_starts"] = coverage.as_dict()

    drawer = wdf_dir / OPEN_DRAWER
    if drawer.is_file():
        _register(bundle, drawer, "Open drawer events")
        bundle.drawer_events, coverage = parse_drawer(drawer)
        bundle.coverage["drawer"] = coverage.as_dict()

    shifts = wdf_dir / SHIFTS
    if shifts.is_file():
        _register(bundle, shifts, "Shift close records")
        bundle.shifts, coverage = parse_shifts(shifts)
        bundle.coverage["shifts"] = coverage.as_dict()

    voids = wdf_dir / VOIDS_PDF
    if voids.is_file():
        _register(bundle, voids, "Voided orders")
        staff = [row["employee"] for row in bundle.production_employees]
        staff += [row["employee"] for row in bundle.tips]
        staff += [row["employee"] for row in bundle.drawer_events]
        staff += [row["closed_by"] for row in bundle.shifts]
        bundle.voids, coverage = parse_voids(voids, staff)
        bundle.coverage["voids"] = coverage.as_dict()

    return bundle
