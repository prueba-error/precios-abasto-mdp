import pytest
from datetime import date
from scraper.scrape import is_price_list_identical

def test_is_price_list_identical():
    scraped = [
        {"original_id": "198", "category_id": 1, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0},
        {"original_id": "27", "category_id": 1, "price_from": 500.0, "price_to": 600.0, "price_avg": 550.0}
    ]
    prod_id_lookup = {("198", 1): 10, ("27", 1): 20}
    
    matching_db = [
        {"product_id": 10, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0},
        {"product_id": 20, "price_from": 500.0, "price_to": 600.0, "price_avg": 550.0}
    ]
    
    different_db = [
        {"product_id": 10, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0},
        {"product_id": 20, "price_from": 500.0, "price_to": 650.0, "price_avg": 575.0}
    ]

    assert is_price_list_identical(scraped, matching_db, prod_id_lookup) is True
    assert is_price_list_identical(scraped, different_db, prod_id_lookup) is False


def test_is_price_list_identical_empty_or_missing():
    prod_id_lookup = {("198", 1): 10}
    scraped = [{"original_id": "198", "category_id": 1, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0}]
    db_records = [{"product_id": 10, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0}]

    assert is_price_list_identical([], db_records, prod_id_lookup) is False
    assert is_price_list_identical(scraped, [], prod_id_lookup) is False
    assert is_price_list_identical(scraped, db_records, {}) is False
    assert is_price_list_identical(scraped, [{"product_id": 99, "price_from": 100.0, "price_to": 120.0, "price_avg": 110.0}], prod_id_lookup) is False


def test_is_price_list_identical_with_nones():
    scraped = [
        {"original_id": "198", "category_id": 1, "price_from": None, "price_to": 120.0, "price_avg": 120.0}
    ]
    prod_id_lookup = {("198", 1): 10}
    matching_db = [
        {"product_id": 10, "price_from": None, "price_to": 120.0, "price_avg": 120.0}
    ]
    diff_db = [
        {"product_id": 10, "price_from": 10.0, "price_to": 120.0, "price_avg": 120.0}
    ]
    assert is_price_list_identical(scraped, matching_db, prod_id_lookup) is True
    assert is_price_list_identical(scraped, diff_db, prod_id_lookup) is False
