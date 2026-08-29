# Specification: Detect Unupdated Price Lists & Emit Warnings

**Date:** 2026-08-29  
**Status:** Approved  
**Target Branch:** `fix/detect-unupdated-prices`  

---

## 1. Overview and Problem Statement

When the Abasto Central MDP market web service does not update its price list over consecutive weeks (e.g. two consecutive Mondays), the scraping pipeline currently re-fetches the same dataset and re-inserts identical price snapshots under a new `snapshot_date`.

To prevent recording stale price snapshots as new data and to alert maintainers:
1. The pipeline will fetch the official market list date from `https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/fecha.php`.
2. The pipeline will check whether the market list date or the scraped product price values are identical to the latest recorded snapshot in Supabase.
3. If no update is detected, the pipeline will **skip inserting duplicate price records**, insert an audit log entry in `scraping_logs` with status `'WARNING'`, emit a GitHub Actions workflow warning annotation, and exit cleanly with exit code `0`.

---

## 2. Architecture & Data Flow

```
[ Abasto Central API ]
  │ 
  ├── POST fecha.php ──────────────► Parse market_date (e.g. "19/08/2026")
  └── POST precios.php (idcat 1..4) ──► Parse normalized product records
  │
[ Python Scraper (run_scraper) ]
  │
  ├── Fetch latest snapshot_date & prices from Supabase (price_records)
  │
  ├── Stale Condition Check:
  │     ├── Condition A: market_date <= latest_snapshot_date
  │     └── Condition B: 100% of scraped prices match previous snapshot prices
  │
  ├── IF STALE (Condition A or B triggers):
  │     ├── Skip upserting price_records
  │     ├── Insert log in scraping_logs (status='WARNING', records_inserted=0, error_message=...)
  │     ├── Emit GitHub Actions warning annotation (::warning title=...)
  │     └── sys.exit(0)
  │
  └── IF FRESH (New data detected):
        └── Proceed with standard UPSERT to products & price_records (status='SUCCESS')
```

---

## 3. Detailed Component Specification

### 3.1. Market Date Parsing & Endpoint Fetcher (`scraper/normalizer.py` & `scraper/scrape.py`)
- **Endpoint:** `POST https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/fecha.php`
- **Function `parse_market_date(raw_text: str) -> Optional[date]`:**
  - Expects text like `"FECHA: 19/08/2026"` or `"19/08/2026"`.
  - Parses date in format `DD/MM/YYYY` using `datetime.strptime`.
  - Returns `datetime.date` object or `None` if unparseable.
- **Function `fetch_market_date(session: requests.Session) -> Optional[date]`:**
  - Performs POST request with `User-Agent: AbastoPreciosBot/1.0`.
  - Catches exceptions and logs a warning if endpoint fails, returning `None`.

### 3.2. Previous Snapshot Inspection (`scraper/scrape.py`)
- Query Supabase `price_records` for the latest `snapshot_date`.
- Query Supabase `price_records` for all records under that latest `snapshot_date` to compare price signatures: `(product_id, price_from, price_to, price_avg)`.

### 3.3. Stale Detection & Action Trigger
- **Check 1 (Date Check):** `market_date` is not `None` and `market_date <= latest_snapshot_date`.
- **Check 2 (Price Signature Check):** Total valid scraped records $> 0$, and for every scraped record, the values `(price_from, price_to, price_avg)` match the previous snapshot's corresponding product record.
- **Action on Stale Detection:**
  - Log warning via standard Python `logging.warning(...)`.
  - Print GitHub Actions annotation: `print("::warning title=Lista de Precios No Actualizada::La fecha del mercado ({market_date}) o los precios no han cambiado desde el último registro ({latest_snapshot_date}).")`.
  - Insert log entry into `scraping_logs`:
    - `snapshot_date`: `today` (or `market_date` if available)
    - `status`: `'WARNING'`
    - `records_inserted`: `0`
    - `error_message`: `"WARNING: Mercado no actualizado. Fecha mercado: {market_date}, último snapshot: {latest_snapshot_date}. Se omitió la inserción de precios duplicados."`
  - Terminate script cleanly (`sys.exit(0)`).

---

## 4. Testing Strategy

1. **Unit Tests in `tests/test_normalizer.py`:**
   - Test `parse_market_date("FECHA: 19/08/2026")` returns `date(2026, 8, 19)`.
   - Test `parse_market_date("invalid")` returns `None`.
   - Test `parse_market_date("19/08/2026")` returns `date(2026, 8, 19)`.

2. **Integration / Logic Tests in `tests/test_stale_detection.py`:**
   - Mock Supabase responses and `fecha.php` response to verify WARNING path when market date is unchanged or prices are identical.
   - Verify `records_inserted = 0` and log entry status `'WARNING'`.

---

## 5. Verification Gate

- Run `pytest` to verify all unit tests pass cleanly.
- Run `python -m scraper.scrape --dry-run` to verify dry run behavior.
