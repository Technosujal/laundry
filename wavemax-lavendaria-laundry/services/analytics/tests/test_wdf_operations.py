from app.ingestion.wdf_reports import ReportBundle
from app.metrics.wdf_operations import build_operations


def test_incomplete_paged_exports_do_not_feed_calculations() -> None:
    coverage = {
        name: {
            "displayed": 1,
            "reported": 2,
            "complete": False,
            "note": "Incomplete export.",
        }
        for name in ("order_list", "machine_starts", "drawer", "shifts", "voids")
    }
    reports = ReportBundle(
        order_list=[{"partial": True}],
        order_list_summary={"orders": "2"},
        machine_starts=[{"partial": True}],
        machine_starts_total={"machine_starts": "10", "grand_total": "20"},
        drawer_events=[{"partial": True}],
        shifts=[{"partial": True}],
        voids=[{"partial": True}],
        coverage=coverage,
    )

    operations = build_operations([], reports)

    assert operations["customers"]["order_list"] == []
    assert operations["customers"]["machine_cost"] == []
    assert operations["customers"]["directory"] == []
    assert operations["voids"]["entries"] == []
    assert operations["drawer"]["events"] == []
    assert operations["shifts"] == []
    assert operations["coverage"] == coverage
