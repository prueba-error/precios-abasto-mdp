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


from unittest.mock import MagicMock, patch
import os
from scraper.scrape import run_scraper

@patch("scraper.scrape.time.sleep")
@patch.dict(os.environ, {"SUPABASE_URL": "https://fake.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "fake-key"})
@patch("scraper.scrape.create_client")
@patch("scraper.scrape.fetch_market_date")
@patch("scraper.scrape.fetch_category_data")
def test_run_scraper_stale_market_date(mock_fetch_cat, mock_fetch_date, mock_create_client, mock_sleep):
    mock_fetch_date.return_value = date(2026, 8, 19)
    # Generate 6 valid items per category (6 * 4 = 24 items total > MIN_TOTAL_RECORDS)
    mock_fetch_cat.return_value = [
        {"id": str(i), "producto": f"PROD_{i}", "categoria": "Frutas", "precio_hasta": "12000"}
        for i in range(1, 7)
    ]
    
    mock_supabase = MagicMock()
    mock_create_client.return_value = mock_supabase
    
    # Mock products query returning product mapping
    mock_prods = [{"id": i, "original_id": str(i), "category_id": cat} for cat in [1, 2, 3, 4] for i in range(1, 7)]
    mock_supabase.table().select().execute.return_value.data = mock_prods
    
    # Mock latest snapshot in DB with same date 2026-08-19
    mock_supabase.table().select().order().limit().execute.return_value.data = [{"snapshot_date": "2026-08-19"}]
    mock_supabase.table().select().eq().execute.return_value.data = [
        {"product_id": i, "price_from": None, "price_to": 12000.0, "price_avg": 12000.0}
        for i in range(1, 7)
    ]
    
    with pytest.raises(SystemExit) as exc_info:
        run_scraper(dry_run=False)
        
    assert exc_info.value.code == 0
    # Verify scraping_logs insertion with status WARNING
    mock_supabase.table.assert_any_call("scraping_logs")
    insert_calls = [call for call in mock_supabase.table().insert.call_args_list]
    assert any("WARNING" in str(c) for c in insert_calls)


@patch("scraper.scrape.time.sleep")
@patch.dict(os.environ, {"SUPABASE_URL": "https://fake.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "fake-key"})
@patch("scraper.scrape.create_client")
@patch("scraper.scrape.fetch_market_date")
@patch("scraper.scrape.fetch_category_data")
def test_run_scraper_stale_identical_prices(mock_fetch_cat, mock_fetch_date, mock_create_client, mock_sleep):
    # Market date is None, but price list is identical to previous snapshot
    mock_fetch_date.return_value = None
    mock_fetch_cat.return_value = [
        {"id": str(i), "producto": f"PROD_{i}", "categoria": "Frutas", "precio_hasta": "12000"}
        for i in range(1, 7)
    ]
    
    mock_supabase = MagicMock()
    mock_create_client.return_value = mock_supabase
    
    # Mock products query returning product mapping
    mock_prods = [{"id": i, "original_id": str(i), "category_id": cat} for cat in [1, 2, 3, 4] for i in range(1, 7)]
    mock_supabase.table().select().execute.return_value.data = mock_prods
    
    # Mock latest snapshot in DB from previous date 2026-08-18 with identical prices
    mock_supabase.table().select().order().limit().execute.return_value.data = [{"snapshot_date": "2026-08-18"}]
    mock_supabase.table().select().eq().execute.return_value.data = [
        {"product_id": i, "price_from": None, "price_to": 12000.0, "price_avg": 12000.0}
        for i in range(1, 7)
    ]
    
    with pytest.raises(SystemExit) as exc_info:
        run_scraper(dry_run=False)
        
    assert exc_info.value.code == 0
    # Verify scraping_logs insertion with status WARNING
    mock_supabase.table.assert_any_call("scraping_logs")
    insert_calls = [call for call in mock_supabase.table().insert.call_args_list]
    assert any("WARNING" in str(c) for c in insert_calls)


@patch("scraper.scrape.time.sleep")
@patch.dict(os.environ, {"SUPABASE_URL": "https://fake.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "fake-key"})
@patch("scraper.scrape.create_client")
@patch("scraper.scrape.fetch_market_date")
@patch("scraper.scrape.fetch_category_data")
def test_run_scraper_success_flow(mock_fetch_cat, mock_fetch_date, mock_create_client, mock_sleep):
    mock_fetch_date.return_value = date(2026, 8, 20)
    mock_fetch_cat.return_value = [
        {"id": str(i), "producto": f"PROD_{i}", "categoria": "Frutas", "precio_hasta": "15000"}
        for i in range(1, 7)
    ]
    
    mock_supabase = MagicMock()
    mock_create_client.return_value = mock_supabase
    
    # Mock products query returning product mapping
    mock_prods = [{"id": i, "original_id": str(i), "category_id": cat} for cat in [1, 2, 3, 4] for i in range(1, 7)]
    mock_supabase.table().select().execute.return_value.data = mock_prods
    
    # Mock latest snapshot in DB from previous date 2026-08-19 (older date than market_date)
    mock_supabase.table().select().order().limit().execute.return_value.data = [{"snapshot_date": "2026-08-19"}]
    mock_supabase.table().select().eq().execute.return_value.data = [
        {"product_id": i, "price_from": None, "price_to": 12000.0, "price_avg": 12000.0}
        for i in range(1, 7)
    ]
    
    # Should run without sys.exit
    run_scraper(dry_run=False)
    
    # Verify price_records upsert
    mock_supabase.table.assert_any_call("price_records")
    # Verify scraping_logs insert with SUCCESS
    mock_supabase.table.assert_any_call("scraping_logs")
    insert_calls = [call for call in mock_supabase.table().insert.call_args_list]
    assert any("SUCCESS" in str(c) for c in insert_calls)



