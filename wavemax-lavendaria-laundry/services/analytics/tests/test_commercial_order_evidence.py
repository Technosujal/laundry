from app.metrics.build_artifact import unmatched_production_orders


def test_unmatched_production_orders_are_derived_from_order_ids() -> None:
    production = [
        {"order_number": "100", "amount": "15.00"},
        {"order_number": "101", "amount": "20.00"},
        {"order_number": "102", "amount": "25.00"},
    ]

    result = unmatched_production_orders({"# 100", "#101"}, production)

    assert result == [{"order_number": "102", "amount": "25.00"}]
