import json
from pathlib import Path
from datetime import date
from scraper.normalizer import normalize_record, is_valid_contract

def test_parse_fixture_records():
    fixture_path = Path(__file__).parent / "fixtures" / "sample_api_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert len(data) == 2
    for item in data:
        assert is_valid_contract(item) is True

    today = date(2026, 8, 14)
    records = [normalize_record(item, category_id=1, snapshot_date=today) for item in data]
    
    assert records[0]["product_name"] == "MANDARINA OKITSU"
    assert records[1]["product_name"] == "MANGO"
    assert records[1]["price_from"] == 15000.0
