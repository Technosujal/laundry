from pathlib import Path

from app.metrics.build_artifact import _attach_source_profiles, _build_source_comparison


def test_source_comparison_aligns_days_and_rolls_up_without_combining_sources() -> None:
    result = _build_source_comparison(
        [
            {"period": "2025-01-01", "subtotal": "10.25"},
            {"period": "2025-01-02", "subtotal": "4.75"},
        ],
        [
            {"period": "2025-01-01", "value": "30.00"},
            {"period": "2025-01-02", "value": "20.00"},
        ],
    )

    assert result["by_day"][0] == {
        "period": "2025-01-01",
        "wdf_counter_sales": "10.25",
        "laundro_machine_revenue": "30.00",
    }
    assert result["by_month"] == [
        {
            "period": "2025-01",
            "wdf_counter_sales": "15.00",
            "laundro_machine_revenue": "50.00",
        }
    ]


def test_source_comparison_keeps_a_source_exclusive_day_visible_as_zero() -> None:
    result = _build_source_comparison(
        [],
        [{"period": "2025-01-03", "value": "8.50"}],
    )

    assert result["by_day"][0]["wdf_counter_sales"] == "0.00"
    assert "difference" not in result["by_day"][0]


def test_source_profile_counts_every_non_empty_csv_cell(tmp_path: Path) -> None:
    path = tmp_path / "source.csv"
    path.write_text("Day,Amount,Note\n2025-01-01,10,\n2025-01-02,20,kept\n", encoding="utf-8")
    sources = [{"source_system": "TEST", "file": path.name}]

    _attach_source_profiles(sources, {"TEST": tmp_path})

    assert sources[0]["row_count"] == 2
    assert sources[0]["non_empty_cells"] == 8
