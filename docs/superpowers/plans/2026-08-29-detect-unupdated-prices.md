# Detect Unupdated Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect when the Abasto Central market price list has not been updated (by checking `fecha.php` market date or comparing price signatures with the previous snapshot in Supabase), skip duplicate price record insertions, insert a `WARNING` audit log, emit a GitHub Actions warning annotation, and exit cleanly with status code `0`.

**Architecture:** Add `parse_market_date` to `scraper/normalizer.py`, add `fetch_market_date` and `is_price_list_identical` helpers in `scraper/scrape.py`, and update `run_scraper` to inspect previous database records from Supabase before committing new snapshots.

**Tech Stack:** Python 3.10+, requests, pytest, Supabase Python Client.

## Global Constraints

- Timezone: `America/Argentina/Buenos_Aires` (UTC-3) for all date handling.
- HTTP Etiquette: `User-Agent: AbastoPreciosBot/1.0 (+https://github.com/Diegolas/scraping-verduras)` header for requests.
- Exit Codes: Successful stale detection exits cleanly with code `0` (status `WARNING` in `scraping_logs`).
- GitHub Actions Annotations: Emit `::warning title=...` stdout messages when a stale list is detected.

---

### Task 1: Market Date Parser & HTTP Fetcher

**Files:**
- Modify: `scraper/normalizer.py`
- Modify: `scraper/scrape.py`
- Test: `tests/test_normalizer.py`

**Interfaces:**
- Consumes: Raw text response from `https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/fecha.php`.
- Produces: `parse_market_date(raw_text: Optional[str]) -> Optional[date]` and `fetch_market_date(session: requests.Session) -> Optional[date]`.

- [ ] **Step 1: Write failing unit test for `parse_market_date`**

In `tests/test_normalizer.py`, add tests for `parse_market_date`:

```python
from scraper.normalizer import parse_market_date

def test_parse_market_date():
    assert parse_market_date("FECHA: 19/08/2026") == date(2026, 8, 19)
    assert parse_market_date("19/08/2026") == date(2026, 8, 19)
    assert parse_market_date("  FECHA: 05/09/2026  \n") == date(2026, 9, 5)
    assert parse_market_date(None) is None
    assert parse_market_date("invalid date") is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_normalizer.py::test_parse_market_date`  
Expected: FAIL with `ImportError: cannot import name 'parse_market_date'`

- [ ] **Step 3: Implement `parse_market_date` in `scraper/normalizer.py`**

Add to `scraper/normalizer.py`:

```python
def parse_market_date(raw_text: Optional[str]) -> Optional[date]:
    if not raw_text:
        return None
    cleaned = str(raw_text).strip()
    match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', cleaned)
    if not match:
        return None
    date_str = match.group(1)
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").date()
    except ValueError:
        return None
```

- [ ] **Step 4: Implement `fetch_market_date` in `scraper/scrape.py`**

In `scraper/scrape.py`, add:

```python
FECHA_API_URL = "https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/fecha.php"

def fetch_market_date(session: requests.Session) -> Optional[date]:
    try:
        response = session.post(FECHA_API_URL, timeout=15)
        response.raise_for_status()
        return parse_market_date(response.text)
    except Exception as e:
        logging.warning(f"Could not fetch market date from fecha.php: {e}")
        return None
```

- [ ] **Step 5: Run tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_normalizer.py`  
Expected: PASS (all tests passing)

- [ ] **Step 6: Commit**

```bash
git add scraper/normalizer.py scraper/scrape.py tests/test_normalizer.py
git commit -m "feat: add market date parser and fecha.php fetcher"
```

---

### Task 2: Previous Snapshot Retrieval & Price Signature Comparison

**Files:**
- Modify: `scraper/scrape.py`
- Test: `tests/test_stale_detection.py`

**Interfaces:**
- Consumes: Scraped normalized records list and Supabase client instance.
- Produces: `get_latest_db_snapshot(supabase) -> Tuple[Optional[date], List[Dict[str, Any]]]` and `is_price_list_identical(all_normalized, db_records, prod_id_lookup) -> bool`.

- [ ] **Step 1: Write failing test for `is_price_list_identical`**

Create `tests/test_stale_detection.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_stale_detection.py`  
Expected: FAIL with `ImportError: cannot import name 'is_price_list_identical'`

- [ ] **Step 3: Implement helper functions in `scraper/scrape.py`**

Add to `scraper/scrape.py`:

```python
def get_latest_db_snapshot(supabase) -> Tuple[Optional[date], List[Dict[str, Any]]]:
    try:
        res = supabase.table("price_records").select("snapshot_date").order("snapshot_date", desc=True).limit(1).execute()
        if not res.data:
            return None, []
        latest_date_str = res.data[0]["snapshot_date"]
        latest_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date()
        
        recs_res = supabase.table("price_records").select("product_id, price_from, price_to, price_avg").eq("snapshot_date", latest_date_str).execute()
        return latest_date, recs_res.data or []
    except Exception as e:
        logging.warning(f"Could not fetch latest database snapshot: {e}")
        return None, []

def is_price_list_identical(
    scraped_records: List[Dict[str, Any]],
    db_records: List[Dict[str, Any]],
    prod_id_lookup: Dict[Tuple[str, int], int]
) -> bool:
    if not scraped_records or not db_records:
        return False
    
    db_map = {r["product_id"]: (r["price_from"], r["price_to"], r["price_avg"]) for r in db_records}
    
    matched_count = 0
    for rec in scraped_records:
        pid = prod_id_lookup.get((rec["original_id"], rec["category_id"]))
        if not pid or pid not in db_map:
            return False
        
        scraped_prices = (
            float(rec["price_from"]) if rec["price_from"] is not None else None,
            float(rec["price_to"]) if rec["price_to"] is not None else None,
            float(rec["price_avg"]) if rec["price_avg"] is not None else None
        )
        db_prices = (
            float(db_map[pid][0]) if db_map[pid][0] is not None else None,
            float(db_map[pid][1]) if db_map[pid][1] is not None else None,
            float(db_map[pid][2]) if db_map[pid][2] is not None else None
        )
        
        if scraped_prices != db_prices:
            return False
        matched_count += 1
        
    return matched_count > 0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_stale_detection.py`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scraper/scrape.py tests/test_stale_detection.py
git commit -m "feat: add database snapshot comparison and price signature helper"
```

---

### Task 3: Integrate Stale Detection, Warning Annotation & Audit Logging into `run_scraper`

**Files:**
- Modify: `scraper/scrape.py`
- Test: `tests/test_stale_detection.py`

**Interfaces:**
- Consumes: Market date from `fetch_market_date` and database records from `get_latest_db_snapshot`.
- Produces: `run_scraper` updated to bypass insertion, log WARNING to `scraping_logs`, emit GitHub Actions warning annotation, and exit `0` when stale.

- [ ] **Step 1: Write integration test for stale detection workflow in `tests/test_stale_detection.py`**

In `tests/test_stale_detection.py`, add mock test for stale detection logic:

```python
from unittest.mock import MagicMock, patch
from scraper.scrape import run_scraper

@patch("scraper.scrape.create_client")
@patch("scraper.scrape.fetch_market_date")
@patch("scraper.scrape.fetch_category_data")
def test_run_scraper_stale_market_date(mock_fetch_cat, mock_fetch_date, mock_create_client):
    mock_fetch_date.return_value = date(2026, 8, 19)
    mock_fetch_cat.return_value = [
        {"id": "198", "producto": "MANDARINA", "categoria": "Frutas", "precio_hasta": "12000"}
    ]
    
    mock_supabase = MagicMock()
    mock_create_client.return_value = mock_supabase
    
    # Mock latest snapshot in DB with same date 2026-08-19
    mock_supabase.table().select().order().limit().execute.return_value.data = [{"snapshot_date": "2026-08-19"}]
    mock_supabase.table().select().eq().execute.return_value.data = [{"product_id": 1, "price_from": None, "price_to": 12000.0, "price_avg": 12000.0}]
    
    with pytest.raises(SystemExit) as exc_info:
        run_scraper(dry_run=False)
        
    assert exc_info.value.code == 0
    # Verify scraping_logs insertion with status WARNING
    log_calls = [call for call in mock_supabase.table().insert().execute.call_args_list]
    assert any("WARNING" in str(c) for c in log_calls)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python.exe -m pytest tests/test_stale_detection.py::test_run_scraper_stale_market_date`  
Expected: FAIL (because `run_scraper` does not yet contain stale check logic)

- [ ] **Step 3: Update `run_scraper` in `scraper/scrape.py`**

In `scraper/scrape.py`, inside `run_scraper`:
1. Use `session = requests.Session()` with custom `User-Agent`.
2. Fetch `market_date = fetch_market_date(session)`.
3. After building products and looking up product IDs, check:
   ```python
   latest_db_date, latest_db_records = get_latest_db_snapshot(supabase)
   
   is_stale_by_date = (market_date is not None and latest_db_date is not None and market_date <= latest_db_date)
   is_stale_by_prices = is_price_list_identical(all_normalized, latest_db_records, prod_id_lookup)
   
   if is_stale_by_date or is_stale_by_prices:
       reason = "fecha del mercado no ha cambiado" if is_stale_by_date else "precios idénticos al snapshot anterior"
       msg = f"WARNING: La lista de precios no se actualizó ({reason}). Fecha mercado: {market_date}, último snapshot: {latest_db_date}."
       logging.warning(msg)
       print(f"::warning title=Lista de Precios No Actualizada::{msg}")
       
       log_entry = {
           "snapshot_date": (market_date or today).isoformat(),
           "status": "WARNING",
           "records_inserted": 0,
           "error_message": msg
       }
       supabase.table("scraping_logs").insert(log_entry).execute()
       sys.exit(0)
   ```

- [ ] **Step 4: Run all pytest tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest`  
Expected: PASS (all tests pass)

- [ ] **Step 5: Test Dry-Run execution**

Run: `.\.venv\Scripts\python.exe -m scraper.scrape --dry-run`  
Expected: Clean execution output

- [ ] **Step 6: Commit**

```bash
git add scraper/scrape.py tests/test_stale_detection.py
git commit -m "feat: integrate stale price detection and warning alerts into run_scraper"
```

---

## Verification Gate

- Run `.\.venv\Scripts\python.exe -m pytest` -> Must pass 100%
- Run `.\.venv\Scripts\python.exe -m scraper.scrape --dry-run` -> Must complete cleanly
