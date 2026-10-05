from __future__ import annotations

import csv
import io
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

ACCOUNTS_PARSER_VERSION = "laundro-accounts-csv/1.0.0"
ACCOUNTS_RULE_VERSION = "laundro-accounts-quality/1.0.0"
VAC_PARSER_VERSION = "laundro-vac-csv/1.0.0"
VAC_RULE_VERSION = "laundro-vac-quality/1.0.0"

ACCOUNTS_FILE = "accounts_report-2.csv"
VAC_FILE = "vac_log.csv"

# Balance bands, in whole dollars. Chosen to separate an empty card from a working balance
# rather than to flatter the distribution.
BALANCE_BANDS: tuple[tuple[str, Decimal, Decimal | None], ...] = (
    ("Zero", Decimal("0"), Decimal("0")),
    ("$0.01–$5.00", Decimal("0.01"), Decimal("5")),
    ("$5.01–$20.00", Decimal("5.01"), Decimal("20")),
    ("$20.01–$50.00", Decimal("20.01"), Decimal("50")),
    ("$50.01+", Decimal("50.01"), None),
)


def _rows(path: Path) -> list[dict[str, str]]:
    text = path.read_bytes().decode("utf-8-sig", errors="replace")
    return [
        {(k or "").strip(): (v or "").strip() for k, v in row.items()}
        for row in csv.DictReader(io.StringIO(text))
    ]


def _decimal(value: str) -> Decimal | None:
    if not value:
        return None
    try:
        parsed = Decimal(value.replace(",", "").replace("$", ""))
    except (InvalidOperation, ValueError):
        return None
    return parsed if parsed.is_finite() else None


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01")))


def build_accounts(path: Path) -> dict[str, Any]:
    """Summarise the stored-value card accounts without publishing anybody's details.

    The export carries a name, email and phone for some accounts. None of that is published:
    this returns counts and totals only, because a dashboard needs to know how many accounts
    hold a balance, not who they belong to. Contactability is reported as a count for the same
    reason, since it is the operationally useful fact and carries no personal data.
    """
    rows = _rows(path)
    if not rows:
        return {"available": False}

    balances: list[Decimal] = []
    unreadable_balance = 0
    types: Counter[str] = Counter()
    devices: Counter[str] = Counter()
    statuses: Counter[str] = Counter()
    bands: Counter[str] = Counter()
    contactable = 0
    with_email = 0
    with_phone = 0
    named = 0
    opt_ins: Counter[str] = Counter()
    last_used: list[str] = []

    for row in rows:
        types[row.get("Account Type") or "Not recorded"] += 1
        devices[row.get("Account Device") or "Not recorded"] += 1
        # The status column is blank for most accounts and carries a flag for the rest; it is
        # a sparse flag rather than a completeness gap, so a blank is reported as its own state.
        statuses[row.get("Account Status") or "No flag recorded"] += 1

        balance = _decimal(row.get("Balance", ""))
        if balance is None:
            unreadable_balance += 1
        else:
            balances.append(balance)
            for label, low, high in BALANCE_BANDS:
                if balance >= low and (high is None or balance <= high):
                    bands[label] += 1
                    break

        email = bool(row.get("Email"))
        phone = bool(row.get("Phone"))
        if email:
            with_email += 1
        if phone:
            with_phone += 1
        if email or phone:
            contactable += 1
        if row.get("First Name") or row.get("Last Name"):
            named += 1

        for column, label in (
            ("Laundry Done SMS Opt-in", "Laundry done SMS"),
            ("Promo Email Opt-in", "Promotional email"),
            ("Promo SMS Opt-in", "Promotional SMS"),
        ):
            if row.get(column):
                opt_ins[label] += 1

        seen = row.get("Last Used")
        if seen:
            last_used.append(seen)

    total_balance = sum(balances, Decimal("0"))
    last_used.sort()

    return {
        "available": True,
        "account_count": len(rows),
        "total_balance": _money(total_balance),
        "average_balance": _money(total_balance / len(balances)) if balances else None,
        "balances_read": len(balances),
        "unreadable_balance": unreadable_balance,
        "zero_balance": bands.get("Zero", 0),
        "balance_bands": [
            {"band": label, "accounts": bands.get(label, 0)} for label, _, _ in BALANCE_BANDS
        ],
        "by_type": [{"name": name, "accounts": count} for name, count in types.most_common()],
        "by_device": [{"name": name, "accounts": count} for name, count in devices.most_common()],
        "by_status": [{"name": name, "accounts": count} for name, count in statuses.most_common()],
        "contactable": contactable,
        "with_email": with_email,
        "with_phone": with_phone,
        "named": named,
        "opt_ins": [{"name": name, "accounts": count} for name, count in opt_ins.most_common()],
        "first_used": last_used[0] if last_used else None,
        "last_used": last_used[-1] if last_used else None,
    }


def build_vac(path: Path) -> dict[str, Any]:
    """Summarise the value-add-centre log, counting each transaction exactly once.

    A reload appears twice: once as the machine's own `vac` row and once as the matching
    `payment processing` row, both under one transaction id. Summing every row therefore
    overstates the value loaded. Money is totalled from the `vac` rows only, and the pairing is
    reported so the reader can see the rule rather than take it on trust.
    """
    rows = _rows(path)
    if not rows:
        return {"available": False}

    by_id: Counter[str] = Counter()
    operations: Counter[str] = Counter()
    devices: Counter[str] = Counter()
    results: Counter[str] = Counter()
    vac_total = Decimal("0")
    vac_rows = 0
    all_rows_total = Decimal("0")
    dates: list[str] = []

    for row in rows:
        kind = (row.get("Data Type") or "").lower()
        tran = row.get("Tran ID") or ""
        if tran:
            by_id[tran] += 1
        # The operation label can carry a card fragment on its second line; only the first line
        # names the operation, and the fragment is deliberately not kept.
        operations[(row.get("Operation") or "Not recorded").splitlines()[0].strip()] += 1
        devices[row.get("Device") or "Not recorded"] += 1
        results[row.get("Result") or "Not recorded"] += 1

        amount = _decimal(row.get("Amount", ""))
        if amount is not None:
            all_rows_total += amount
            if kind == "vac":
                vac_total += amount
                vac_rows += 1

        when = row.get("Date")
        if when:
            dates.append(when)

    paired = sum(1 for count in by_id.values() if count > 1)
    dates.sort()
    overstatement = all_rows_total - vac_total

    return {
        "available": True,
        "row_count": len(rows),
        "transaction_count": len(by_id),
        "paired_transactions": paired,
        "vac_rows": vac_rows,
        "value_loaded": _money(vac_total),
        "every_row_total": _money(all_rows_total),
        "double_counted_if_summed_naively": _money(overstatement),
        "overstatement_percent": str((overstatement / vac_total * 100).quantize(Decimal("0.1")))
        if vac_total
        else None,
        "by_operation": [
            {"name": name, "count": count} for name, count in operations.most_common()
        ],
        "by_device": [{"name": name, "count": count} for name, count in devices.most_common()],
        "by_result": [{"name": name, "count": count} for name, count in results.most_common()],
        "first_seen": dates[0] if dates else None,
        "last_seen": dates[-1] if dates else None,
    }
