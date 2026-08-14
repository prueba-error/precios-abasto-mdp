import pytest
from datetime import date
from scraper.normalizer import is_valid_contract, clean_price_val, calculate_avg, normalize_record, get_argentina_date

def test_is_valid_contract():
    valid_item = {"id": "198", "producto": "MANDARINA", "categoria": "Frutas", "precio_hasta": "12000"}
    invalid_no_price = {"id": "198", "producto": "MANDARINA", "categoria": "Frutas", "precio_desde": "-", "precio_hasta": ""}
    invalid_no_id = {"id": "", "producto": "MANDARINA", "categoria": "Frutas", "precio_hasta": "12000"}
    
    assert is_valid_contract(valid_item) is True
    assert is_valid_contract(invalid_no_price) is False
    assert is_valid_contract(invalid_no_id) is False

def test_clean_price_val():
    assert clean_price_val("-") is None
    assert clean_price_val("") is None
    assert clean_price_val("12000") == 12000.0
    assert clean_price_val("15000.50") == 15000.50

def test_calculate_avg():
    assert calculate_avg(10000.0, 12000.0) == 11000.0
    assert calculate_avg(10000.0, None) == 10000.0
    assert calculate_avg(None, 12000.0) == 12000.0
    assert calculate_avg(None, None) is None

def test_get_argentina_date():
    today_arg = get_argentina_date()
    assert isinstance(today_arg, date)

def test_normalize_record():
    raw = {
        "id": "198",
        "producto": " MANDARINA OKITSU ",
        "estado": "1",
        "categoria": "Frutas",
        "precio_desde": "-",
        "precio_hasta": "12000",
        "origen": "ENTRE RIOS",
        "presentacion": "CAJON",
        "cantidad": "18 KG."
    }
    today = date(2026, 8, 14)
    normalized = normalize_record(raw, category_id=1, snapshot_date=today)
    
    assert normalized["original_id"] == "198"
    assert normalized["product_name"] == "MANDARINA OKITSU"
    assert normalized["category_id"] == 1
    assert normalized["price_from"] is None
    assert normalized["price_to"] == 12000.0
    assert normalized["price_avg"] == 12000.0
    assert normalized["origin"] == "ENTRE RIOS"
    assert normalized["presentation"] == "CAJON"
    assert normalized["quantity_raw"] == "18 KG."
    assert normalized["snapshot_date"] == "2026-08-14"
