from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from decimal import Decimal
from hashlib import sha256
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

from app.ingestion.fingerprint import fingerprint_file
from app.ingestion.laundro_accounts import (
    ACCOUNTS_FILE,
    ACCOUNTS_PARSER_VERSION,
    ACCOUNTS_RULE_VERSION,
    VAC_FILE,
    VAC_PARSER_VERSION,
    VAC_RULE_VERSION,
    build_accounts,
    build_vac,
)
from app.ingestion.laundro_daily import (
    DAILY_SERIES,
    parse_daily_series,
)
from app.ingestion.laundro_daily import (
    PARSER_VERSION as DAILY_PARSER_VERSION,
)
from app.ingestion.laundro_daily import (
    RULE_VERSION as DAILY_RULE_VERSION,
)
from app.ingestion.laundro_machines import (
    PARSER_VERSION as MACHINE_PARSER_VERSION,
)
from app.ingestion.laundro_machines import (
    SOURCE_FILENAME as MACHINE_FILENAME,
)
from app.ingestion.laundro_machines import (
    parse_machine_totals,
)
from app.ingestion.laundro_models import MeasureUnit
from app.ingestion.models import OutcomeStatus
from app.ingestion.wdf_financial_summary import (
    parse_financial_summary,
)
from app.ingestion.wdf_reports import load_reports
from app.ingestion.wdf_timesheet import (
    PARSER_VERSION as TIMESHEET_PARSER_VERSION,
)
from app.ingestion.wdf_timesheet import (
    RULE_VERSION as TIMESHEET_RULE_VERSION,
)
from app.ingestion.wdf_timesheet import (
    SOURCE_FILENAME as TIMESHEET_FILENAME,
)
from app.ingestion.wdf_timesheet import (
    parse_timesheet,
)
from app.metrics.aggregate import aggregate, totals
from app.metrics.definitions import METRICS_BY_ID
from app.metrics.wdf_operations import (
    build_basket,
    build_every_item,
    build_operations,
    build_product_detail,
)
from app.metrics.wdf_sales_analytics import SalesLine, build_sales_analytics
from app.metrics.wdf_sales_facts import build_sales_facts
from app.quality.audit_validator import validate_artifact

ARTIFACT_VERSION = "wavemax-analytics-artifact/1.0.0"
WDF_WORKBOOK = "WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx"
WDF_SHEET = "Sales Breakdown"

SERIES_TO_METRIC = {
    "machine_revenue": "machine_revenue_total",
    "washer_cycles": "washer_cycles_total",
    "card_payments": "card_value_loaded_total",
    "accounts_used": "accounts_used_total",
    "new_cards": "new_cards_total",
    "free_starts": "management_card_starts_value",
}


class SourceMissingError(FileNotFoundError):
    """Raised when a required source file is not present."""


def build_artifact(*, laundro_dir: Path, wdf_dir: Path) -> dict[str, Any]:
    """Build the deterministic analytics artifact the API serves.

    Every measure carries its definition, its computed values, and its data-quality outcome.
    Nothing is emitted that does not have a definition in the registry.
    """
    sources: list[dict[str, Any]] = []
    metrics: dict[str, Any] = {}

    for spec in DAILY_SERIES:
        path = laundro_dir / spec.filename
        if not path.is_file():
            raise SourceMissingError(f"Required source is missing: {spec.filename}")
        fp = fingerprint_file(path)
        outcomes = list(parse_daily_series(path, spec=spec, source_sha256=fp.sha256))
        accepted = [o for o in outcomes if o.status is OutcomeStatus.ACCEPTED]
        quarantined = [o for o in outcomes if o.status is OutcomeStatus.QUARANTINED]
        if len(outcomes) != len(accepted) + len(quarantined):
            raise AssertionError("Row accounting failed for " + spec.series_id)

        points = [o.parsed for o in accepted if o.parsed is not None]
        total, distinct_days, first_day, last_day = totals(points)
        metric_id = SERIES_TO_METRIC[spec.series_id]
        definition = METRICS_BY_ID[metric_id]

        metrics[metric_id] = {
            "definition": definition.as_dict(),
            "unit": str(spec.unit),
            "machine_scope": str(spec.machine_scope),
            "business_event": spec.business_event,
            "source_coverage_note": spec.coverage_note,
            "total": _format(total, spec.unit),
            "first_day": first_day,
            "last_day": last_day,
            "distinct_days": distinct_days,
            "by_year": [p.as_dict(spec.unit) for p in aggregate(points, "year")],
            "by_month": [p.as_dict(spec.unit) for p in aggregate(points, "month")],
            "by_day": [p.as_dict(spec.unit) for p in aggregate(points, "day")],
            "quality": {
                "input_rows": len(outcomes),
                "accepted_rows": len(accepted),
                "quarantined_rows": len(quarantined),
                "reason_counts": _counts(o.reason_codes for o in outcomes),
                "warning_counts": _counts(o.warning_codes for o in outcomes),
            },
        }
        sources.append(
            {
                "source_system": "LAUNDRO_PORTAL",
                "file": spec.filename,
                "sha256": fp.sha256,
                "size_bytes": fp.size_bytes,
                "parser_version": DAILY_PARSER_VERSION,
                "rule_version": DAILY_RULE_VERSION,
            }
        )

    machines, machine_source = _build_machines(laundro_dir)
    sources.append(machine_source)

    # The two LaundroPortal exports that had never been ingested: the stored-value account
    # register and the value-add-centre transaction log.
    accounts: dict[str, Any] = {"available": False}
    accounts_path = laundro_dir / ACCOUNTS_FILE
    if accounts_path.is_file():
        accounts = build_accounts(accounts_path)
        fp_accounts = fingerprint_file(accounts_path)
        sources.append(
            {
                "source_system": "LAUNDRO_PORTAL",
                "file": ACCOUNTS_FILE,
                "sha256": fp_accounts.sha256,
                "size_bytes": fp_accounts.size_bytes,
                "parser_version": ACCOUNTS_PARSER_VERSION,
                "rule_version": ACCOUNTS_RULE_VERSION,
                "feeds": "Stored-value card accounts and balances",
            }
        )

    vac: dict[str, Any] = {"available": False}
    vac_path = laundro_dir / VAC_FILE
    if vac_path.is_file():
        vac = build_vac(vac_path)
        fp_vac = fingerprint_file(vac_path)
        sources.append(
            {
                "source_system": "LAUNDRO_PORTAL",
                "file": VAC_FILE,
                "sha256": fp_vac.sha256,
                "size_bytes": fp_vac.size_bytes,
                "parser_version": VAC_PARSER_VERSION,
                "rule_version": VAC_RULE_VERSION,
                "feeds": "Card reloads and payment terminal transactions",
            }
        )

    wdf, wdf_source = _build_wdf_sales(wdf_dir)
    sources.append(wdf_source)
    # The operational reports the dashboards already use, so provenance names every file that
    # actually fed a figure rather than only the workbook and the timesheet.
    sources.extend(load_reports(wdf_dir).sources)

    workforce, workforce_source = _build_workforce(wdf_dir)
    sources.append(workforce_source)

    source_comparison = _build_source_comparison(
        wdf["analytics"]["by_day"], metrics["machine_revenue_total"]["by_day"]
    )
    _register_supplied_files(sources, wdf_dir, "WDF_POS")
    _register_supplied_files(sources, laundro_dir, "LAUNDRO_PORTAL")
    _attach_source_profiles(sources, {"WDF_POS": wdf_dir, "LAUNDRO_PORTAL": laundro_dir})

    run_id = sha256(
        "|".join(sorted(f"{s['file']}:{s['sha256']}" for s in sources)).encode()
    ).hexdigest()

    artifact = {
        "accounts": accounts,
        "vac": vac,
        "artifact_version": ARTIFACT_VERSION,
        "run_id": run_id,
        "sources": sorted(sources, key=lambda s: s["file"]),
        "source_comparison": source_comparison,
        "metrics": metrics,
        "machines": machines,
        "wdf_sales": wdf,
        "workforce": workforce,
    }
    config_path = Path(__file__).parents[2] / "config" / "dq_config.yaml"
    artifact["health"] = validate_artifact(artifact, config_path)
    return artifact


def _register_supplied_files(
    sources: list[dict[str, Any]], directory: Path, source_system: str
) -> None:
    """Account for every supplied file, including alternate renderings and empty shells."""
    registered = {str(source["file"]) for source in sources}
    for path in sorted(
        (item for item in directory.iterdir() if item.is_file()), key=lambda p: p.name
    ):
        if path.name in registered:
            continue
        fingerprint = fingerprint_file(path)
        inventory_shell = "inventory" in path.name.lower()
        sources.append(
            {
                "source_system": source_system,
                "file": path.name,
                "sha256": fingerprint.sha256,
                "size_bytes": fingerprint.size_bytes,
                "parser_version": "source-inventory/1.0.0",
                "rule_version": "source-inventory/1.0.0",
                "disposition": "NO_RECORDS" if inventory_shell else "REFERENCE_COPY",
                "feeds": (
                    "Reviewed; the saved page shell contains no inventory records."
                    if inventory_shell
                    else (
                        "Accounted for as an alternate or reference rendering; no value is "
                        "double-counted."
                    )
                ),
            }
        )


def _attach_source_profiles(sources: list[dict[str, Any]], directories: dict[str, Path]) -> None:
    """Scan every tabular cell and publish privacy-safe file-level accounting counts."""
    for source in sources:
        path = directories[str(source["source_system"])] / str(source["file"])
        if path.suffix.lower() == ".csv":
            with path.open("r", encoding="utf-8-sig", newline="") as stream:
                rows = list(csv.reader(stream))
            source["row_count"] = max(0, len(rows) - 1)
            source["non_empty_cells"] = sum(
                1 for row in rows for value in row if str(value).strip()
            )
            source["sheet_count"] = 1
        elif path.suffix.lower() == ".xlsx":
            workbook = load_workbook(path, read_only=True, data_only=True)
            try:
                row_count = 0
                non_empty = 0
                for sheet in workbook.worksheets:
                    populated_rows = 0
                    for row in sheet.iter_rows(values_only=True):
                        values = [
                            value for value in row if value is not None and str(value).strip()
                        ]
                        if values:
                            populated_rows += 1
                            non_empty += len(values)
                    row_count += max(0, populated_rows - 1)
                source["row_count"] = row_count
                source["non_empty_cells"] = non_empty
                source["sheet_count"] = len(workbook.worksheets)
            finally:
                workbook.close()


def _build_source_comparison(
    wdf_daily: list[dict[str, Any]], laundro_daily: list[dict[str, Any]]
) -> dict[str, Any]:
    """Align the two recorded revenue streams without pretending they are the same event.

    WDF supplies paid counter-sale lines and LaundroPortal supplies value consumed at machines.
    The values are useful side by side, but they are not subtracted or summed because the supplied
    files do not prove that they represent compatible populations.
    """
    wdf = {str(row["period"]): Decimal(str(row["subtotal"])) for row in wdf_daily}
    laundro = {str(row["period"]): Decimal(str(row["value"])) for row in laundro_daily}
    days = sorted(set(wdf) | set(laundro))

    def render(period: str, wdf_value: Decimal, laundro_value: Decimal) -> dict[str, str]:
        return {
            "period": period,
            "wdf_counter_sales": str(wdf_value.quantize(Decimal("0.01"))),
            "laundro_machine_revenue": str(laundro_value.quantize(Decimal("0.01"))),
        }

    by_day = [
        render(day, wdf.get(day, Decimal("0")), laundro.get(day, Decimal("0"))) for day in days
    ]

    def rollup(length: int) -> list[dict[str, str]]:
        buckets: dict[str, tuple[Decimal, Decimal]] = {}
        for row in by_day:
            period = row["period"][:length]
            left, right = buckets.get(period, (Decimal("0"), Decimal("0")))
            buckets[period] = (
                left + Decimal(row["wdf_counter_sales"]),
                right + Decimal(row["laundro_machine_revenue"]),
            )
        return [render(period, *buckets[period]) for period in sorted(buckets)]

    return {
        "definition_version": "wavemax-source-comparison/1.0.0",
        "formula": "WDF paid counter sales and LaundroPortal machine revenue shown separately",
        "meaning": (
            "Two source measures aligned to the same calendar periods. No combined total, "
            "difference, or reconciliation variance is calculated."
        ),
        "by_day": by_day,
        "by_month": rollup(7),
        "by_year": rollup(4),
        "supported": {
            "day": True,
            "month": True,
            "year": True,
            "time_of_day": False,
            "customer": False,
        },
        "limitations": [
            (
                "LaundroPortal supplies dates but no time-of-day field, so hourly comparison "
                "is unavailable."
            ),
            (
                "The supplied sources have no safe shared customer identifier, so customer "
                "comparison is unavailable."
            ),
            (
                "WDF paid counter sales omit voided and processed commercial orders; "
                "LaundroPortal machine revenue covers all machines."
            ),
        ],
    }


def _build_workforce(wdf_dir: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    path = wdf_dir / TIMESHEET_FILENAME
    if not path.is_file():
        raise SourceMissingError(f"Required source is missing: {TIMESHEET_FILENAME}")
    fp = fingerprint_file(path)
    outcomes = list(parse_timesheet(path, source_sha256=fp.sha256))
    accepted = [o for o in outcomes if o.status is OutcomeStatus.ACCEPTED]
    entries = [o.parsed for o in accepted if o.parsed is not None]

    plausible = [e for e in entries if e.plausible]
    excluded = [e for e in entries if not e.plausible]

    per_employee: dict[str, dict[str, int]] = defaultdict(
        lambda: {"minutes": 0, "entries": 0, "excluded": 0}
    )
    for entry in entries:
        bucket = per_employee[entry.employee_key]
        if entry.plausible:
            bucket["minutes"] += entry.duration_minutes
            bucket["entries"] += 1
        else:
            bucket["excluded"] += 1

    plausible_minutes = sum(e.duration_minutes for e in plausible)
    excluded_minutes = sum(e.duration_minutes for e in excluded)
    definition = METRICS_BY_ID["workforce_plausible_hours"]

    return (
        {
            "definition": definition.as_dict(),
            "plausible_hours": str(
                (Decimal(plausible_minutes) / Decimal(60)).quantize(Decimal("0.1"))
            ),
            "plausible_entries": len(plausible),
            "excluded_entries": len(excluded),
            "excluded_hours": str(
                (Decimal(excluded_minutes) / Decimal(60)).quantize(Decimal("0.1"))
            ),
            "reported_total_hours": str(
                (Decimal(plausible_minutes + excluded_minutes) / Decimal(60)).quantize(
                    Decimal("0.1")
                )
            ),
            "employee_count": len(per_employee),
            "by_employee": [
                {
                    "employee_key": key,
                    "hours": str((Decimal(v["minutes"]) / Decimal(60)).quantize(Decimal("0.1"))),
                    "entries": v["entries"],
                    "excluded_entries": v["excluded"],
                }
                for key, v in sorted(
                    per_employee.items(), key=lambda kv: kv[1]["minutes"], reverse=True
                )
            ],
            "quality": {
                "input_rows": len(outcomes),
                "accepted_rows": len(accepted),
                "quarantined_rows": len(outcomes) - len(accepted),
                "warning_counts": _counts(o.warning_codes for o in outcomes),
            },
        },
        {
            "source_system": "WDF_POS",
            "file": TIMESHEET_FILENAME,
            "sha256": fp.sha256,
            "size_bytes": fp.size_bytes,
            "parser_version": TIMESHEET_PARSER_VERSION,
            "rule_version": TIMESHEET_RULE_VERSION,
        },
    )


def _counts(groups: Any) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for group in groups:
        counter.update(group)
    return dict(sorted(counter.items()))


def _format(value: Decimal, unit: MeasureUnit) -> str:
    if unit is MeasureUnit.CURRENCY_USD:
        return str(value.quantize(Decimal("0.01")))
    if value == value.to_integral_value():
        return str(int(value))
    return str(value)


def _build_machines(laundro_dir: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    path = laundro_dir / MACHINE_FILENAME
    if not path.is_file():
        raise SourceMissingError(f"Required source is missing: {MACHINE_FILENAME}")
    fp = fingerprint_file(path)
    outcomes = list(parse_machine_totals(path, source_sha256=fp.sha256))
    accepted = [o for o in outcomes if o.status is OutcomeStatus.ACCEPTED]
    rows = [o.parsed for o in accepted if o.parsed is not None]

    by_class: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"revenue": Decimal("0"), "cycles": Decimal("0"), "count": 0}
    )
    for row in rows:
        bucket = by_class[row.machine_class]
        bucket["revenue"] = Decimal(bucket["revenue"]) + row.total_revenue
        bucket["cycles"] = Decimal(bucket["cycles"]) + row.total_cycles
        bucket["count"] = int(bucket["count"]) + 1

    return (
        {
            "machine_count": len(rows),
            "by_class": {
                name: {
                    "machine_count": int(v["count"]),
                    "revenue": str(Decimal(v["revenue"]).quantize(Decimal("0.01"))),
                    "cycles": str(int(Decimal(v["cycles"]))),
                }
                for name, v in sorted(by_class.items())
            },
            "machines": [
                {
                    "machine": r.machine,
                    "machine_class": r.machine_class,
                    "revenue": str(r.total_revenue.quantize(Decimal("0.01"))),
                    "cycles": str(int(r.total_cycles)),
                }
                for r in sorted(rows, key=lambda r: r.machine)
            ],
            "quality": {
                "input_rows": len(outcomes),
                "accepted_rows": len(accepted),
                "quarantined_rows": len(outcomes) - len(accepted),
                "warning_counts": _counts(o.warning_codes for o in outcomes),
            },
            "scope_warning": (
                "Revenue covers every machine, but the supplied cycle history covers washers "
                "only. Dryers report revenue with no cycles here, so revenue and cycles must "
                "never be divided against each other without stating the machine scope."
            ),
        },
        {
            "source_system": "LAUNDRO_PORTAL",
            "file": MACHINE_FILENAME,
            "sha256": fp.sha256,
            "size_bytes": fp.size_bytes,
            "parser_version": MACHINE_PARSER_VERSION,
            "rule_version": MACHINE_PARSER_VERSION,
        },
    )


def unmatched_production_orders(
    paid_orders: set[str], production_orders: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    paid_ids = {re.sub(r"[^0-9]", "", order) for order in paid_orders}
    return [row for row in production_orders if row["order_number"] not in paid_ids]


def _build_wdf_sales(wdf_dir: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    path = wdf_dir / WDF_WORKBOOK
    if not path.is_file():
        raise SourceMissingError(f"Required source is missing: {WDF_WORKBOOK}")
    fp = fingerprint_file(path)
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        sheet = workbook[WDF_SHEET]
        rows = sheet.iter_rows(values_only=True)
        headers = [str(h) if h is not None else "" for h in next(rows)]
        index = {h: i for i, h in enumerate(headers)}

        per_order: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "subtotal": Decimal("0"),
                "lines": 0,
                "paid_date": None,
                "categories": set(),
                "laundry": False,
            }
        )
        by_category: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"subtotal": Decimal("0"), "lines": 0, "orders": set()}
        )
        by_department: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"subtotal": Decimal("0"), "lines": 0, "orders": set()}
        )
        total = Decimal("0")
        line_count = 0
        orders: set[str] = set()
        negative_lines = 0
        zero_lines = 0
        sales_lines: list[SalesLine] = []
        seen_source_rows: dict[tuple[Any, ...], int] = {}
        duplicate_lines = 0
        duplicate_value = Decimal("0")
        duplicate_rows: list[dict[str, Any]] = []
        category_flag_conflicts = 0
        category_flag_conflict_value = Decimal("0")
        blank_units = 0
        blank_categories = 0

        for source_row_number, row in enumerate(rows, start=2):
            raw_subtotal = row[index["Line Item Subtotal"]]
            if raw_subtotal is None:
                continue
            subtotal = Decimal(str(raw_subtotal))
            raw_category = str(row[index["Category"]] or "").strip()
            raw_units = str(row[index["Units"]] or "").strip()
            laundry_flag = row[index["Laundry Service Item"]] is True
            category = raw_category or "Uncategorised"
            department = (row[index["Department"]] or "No department").strip() or "No department"
            order = str(row[index["Order #"]] or "").strip()

            source_key = tuple(row)
            if source_key in seen_source_rows:
                duplicate_lines += 1
                duplicate_value += subtotal
                paid_date = row[index["Paid Date"]]
                duplicate_rows.append(
                    {
                        "original_row": seen_source_rows[source_key],
                        "repeated_row": source_row_number,
                        "order_number": order,
                        "paid_date": (
                            paid_date.isoformat()
                            if hasattr(paid_date, "isoformat")
                            else str(paid_date or "")
                        ),
                        "item_name": str(row[index["Line Item Name"]] or "Unnamed item").strip(),
                        "category": category,
                        "subtotal": str(subtotal.quantize(Decimal("0.01"))),
                    }
                )
            else:
                seen_source_rows[source_key] = source_row_number
            if raw_category == "Drop-Off Laundry" and not laundry_flag:
                category_flag_conflicts += 1
                category_flag_conflict_value += subtotal
            if not raw_units:
                blank_units += 1
            if not raw_category:
                blank_categories += 1

            total += subtotal
            line_count += 1
            if subtotal < 0:
                negative_lines += 1
            if subtotal == 0:
                zero_lines += 1
            if order:
                orders.add(order)

            for bucket, key in ((by_category, category), (by_department, department)):
                entry = bucket[key]
                entry["subtotal"] = Decimal(entry["subtotal"]) + subtotal
                entry["lines"] = int(entry["lines"]) + 1
                if order:
                    entry["orders"].add(order)

            paid_at = row[index["Paid Date"]]
            if order and isinstance(paid_at, datetime):
                quantity = Decimal(str(row[index["Quantity"]] or 0))
                tax_value = Decimal(str(row[index["Tax 1"]] or 0))
                units_raw = row[index["Units"]]
                sales_lines.append(
                    SalesLine(
                        paid_at=paid_at,
                        order_number=order,
                        category=category,
                        department=department,
                        item_name=(row[index["Line Item Name"]] or "Unnamed item").strip()
                        or "Unnamed item",
                        quantity=quantity,
                        units=str(units_raw).strip() if units_raw is not None else None,
                        subtotal=subtotal,
                        tax=tax_value,
                        # Category is the audited business rule for the service split. The raw
                        # flag is retained only in source_quality so conflicts stay visible.
                        laundry_service=raw_category == "Drop-Off Laundry",
                    )
                )

            if order:
                record = per_order[order]
                record["subtotal"] = Decimal(record["subtotal"]) + subtotal
                record["lines"] = int(record["lines"]) + 1
                record["categories"].add(category)
                if raw_category == "Drop-Off Laundry":
                    record["laundry"] = True
                paid = row[index["Paid Date"]]
                if paid is not None:
                    stamp = paid.isoformat() if hasattr(paid, "isoformat") else str(paid)
                    current = record["paid_date"]
                    if current is None or stamp < current:
                        record["paid_date"] = stamp
    finally:
        workbook.close()

    def render(bucket: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "name": name,
                "subtotal": str(Decimal(v["subtotal"]).quantize(Decimal("0.01"))),
                "line_count": int(v["lines"]),
                "order_count": len(v["orders"]),
            }
            for name, v in sorted(
                bucket.items(), key=lambda kv: Decimal(kv[1]["subtotal"]), reverse=True
            )
        ]

    definition = METRICS_BY_ID["wdf_pos_paid_sales_total"]
    financial = parse_financial_summary(path)
    reports = load_reports(wdf_dir)
    absent_commercial_records = unmatched_production_orders(orders, reports.production_orders)
    absent_commercial_value = sum(
        (Decimal(row["amount"]) for row in absent_commercial_records), Decimal("0")
    )
    financial_values = financial.as_dict()
    return (
        {
            "definition": definition.as_dict(),
            "analytics": build_sales_analytics(sales_lines),
            "facts": build_sales_facts(sales_lines),
            "operations": build_operations(sales_lines, reports),
            "product_detail": build_product_detail(sales_lines),
            "basket": build_basket(sales_lines),
            "every_item": build_every_item(sales_lines),
            "financial_summary": financial_values,
            "total": str(total.quantize(Decimal("0.01"))),
            "line_count": line_count,
            "order_count": len(orders),
            "negative_lines": negative_lines,
            "zero_lines": zero_lines,
            "source_quality": {
                "duplicate_lines": duplicate_lines,
                "duplicate_value": str(duplicate_value.quantize(Decimal("0.01"))),
                "duplicate_rows": duplicate_rows,
                "category_flag_conflicts": category_flag_conflicts,
                "category_flag_conflict_value": str(
                    category_flag_conflict_value.quantize(Decimal("0.01"))
                ),
                "blank_units": blank_units,
                "blank_categories": blank_categories,
            },
            "by_category": render(by_category),
            "by_department": render(by_department),
            "orders": [
                {
                    "order_number": order,
                    "paid_date": v["paid_date"],
                    "subtotal": str(Decimal(v["subtotal"]).quantize(Decimal("0.01"))),
                    "line_count": int(v["lines"]),
                    "categories": sorted(v["categories"]),
                    "laundry_service": bool(v["laundry"]),
                }
                for order, v in sorted(
                    per_order.items(),
                    key=lambda kv: (kv[1]["paid_date"] or "", kv[0]),
                    reverse=True,
                )
            ],
            "coverage": {
                "state": "PARTIAL",
                "reason": "COMMERCIAL_AND_VOIDED_ORDERS_ABSENT",
                "explanation": (
                    "Every supplied row is counted, and this total reconciles exactly to the "
                    "workbook's own financial summary. It nonetheless represents roughly 56% of "
                    "non-voided order value for 2025, because voided orders and large commercial "
                    "orders that were processed but never reached the paid-sales export are not "
                    "present in this source."
                ),
                "absent_commercial_value": str(absent_commercial_value.quantize(Decimal("0.01"))),
                "absent_commercial_orders": len(absent_commercial_records),
                "absent_commercial_records": absent_commercial_records,
                "voided_value_gross": financial_values["totals"].get("Total Voided Sales", "0.00"),
            },
        },
        {
            "source_system": "WDF_POS",
            "file": WDF_WORKBOOK,
            "sha256": fp.sha256,
            "size_bytes": fp.size_bytes,
            "parser_version": "wdf-sales-xlsx/1.0.0",
            "rule_version": "wdf-sales-quality/1.0.0",
        },
    )


def write_artifact(artifact: dict[str, Any], destination: Path) -> str:
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, indent=2, sort_keys=True) + "\n"
    destination.write_text(payload, encoding="utf-8", newline="\n")
    return sha256(payload.encode()).hexdigest()
