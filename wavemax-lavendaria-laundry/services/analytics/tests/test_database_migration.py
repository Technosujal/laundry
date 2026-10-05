from __future__ import annotations

from pathlib import Path


def test_ingestion_migration_enforces_accounting_lineage_and_idempotency() -> None:
    repository_root = Path(__file__).resolve().parents[3]
    sql = (
        repository_root / "packages" / "database" / "migrations" / "0002_ingestion_foundation.sql"
    ).read_text(encoding="utf-8")

    assert "input_rows = accepted_rows + quarantined_rows" in sql
    assert "UNIQUE (store_id, source_system, sha256)" in sql
    assert "UNIQUE (source_file_id, parser_version, rule_version)" in sql
    assert "UNIQUE (source_file_id, sheet_name, source_row_number)" in sql
    assert "outcome IN ('ACCEPTED', 'QUARANTINED')" in sql
    assert "raw_record jsonb NOT NULL" in sql
    assert "line_item_subtotal numeric NOT NULL" in sql
