from __future__ import annotations

from pathlib import Path

import pytest

from app.ingestion.fingerprint import fingerprint_file
from app.ingestion.source_store import (
    ContentAddressedLocalSourceStore,
    ImmutableSourceError,
)


def test_retains_identical_source_once_without_changing_input(tmp_path: Path) -> None:
    source = tmp_path / "outside" / "source.xlsx"
    source.parent.mkdir()
    source.write_bytes(b"approved source bytes")
    before = fingerprint_file(source)
    store = ContentAddressedLocalSourceStore(tmp_path / "raw")

    first = store.retain(source, source_system="wdf_pos")
    second = store.retain(source, source_system="wdf_pos")

    assert first.created is True
    assert second.created is False
    assert first.path == second.path
    assert fingerprint_file(source) == before
    assert fingerprint_file(first.path) == before


def test_refuses_a_corrupt_existing_content_address(tmp_path: Path) -> None:
    source = tmp_path / "source.xlsx"
    source.write_bytes(b"correct bytes")
    fingerprint = fingerprint_file(source)
    target = tmp_path / "raw" / "wdf_pos" / fingerprint.sha256[:2]
    target.mkdir(parents=True)
    (target / f"{fingerprint.sha256}.xlsx").write_bytes(b"different bytes")

    with pytest.raises(ImmutableSourceError, match="changed"):
        ContentAddressedLocalSourceStore(tmp_path / "raw").retain(source, source_system="wdf_pos")


def test_rejects_an_unsupported_file_type(tmp_path: Path) -> None:
    source = tmp_path / "source.csv"
    source.write_text("not,xlsx", encoding="utf-8")

    with pytest.raises(ImmutableSourceError, match="Only .xlsx"):
        ContentAddressedLocalSourceStore(tmp_path / "raw").retain(source, source_system="wdf_pos")
