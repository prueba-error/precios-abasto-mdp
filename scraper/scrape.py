import os
import sys
import time
import json
import logging
import requests
from datetime import date, datetime
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from supabase import create_client
from scraper.normalizer import normalize_record, get_argentina_date, is_valid_contract, parse_market_date

# Load environment variables from .env file if present
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

API_URL = "https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php"
FECHA_API_URL = "https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/fecha.php"
USER_AGENT = "AbastoPreciosBot/1.0 (+https://github.com/Diegolas/scraping-verduras)"
CATEGORIES = [1, 2, 3, 4]
MIN_TOTAL_RECORDS = 20
MIN_GLOBAL_VALID_RATIO = 0.70
MIN_CAT_VALID_RATIO = 0.60

def fetch_market_date(session: requests.Session) -> Optional[date]:
    try:
        response = session.post(FECHA_API_URL, timeout=15)
        response.raise_for_status()
        return parse_market_date(response.text)
    except Exception as e:
        logging.warning(f"Could not fetch market date from fecha.php: {e}")
        return None

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


def fetch_category_data(category_id: int, session: Optional[requests.Session] = None) -> List[Dict[str, Any]]:
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": USER_AGENT})
        adapter = requests.adapters.HTTPAdapter(max_retries=3)
        session.mount("https://", adapter)
    
    response = session.post(API_URL, data={"idcat": category_id}, timeout=15)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        raise ValueError(f"Expected list response for idcat={category_id}, got {type(data)}")
    return data

def run_scraper(dry_run: bool = False) -> None:
    today = get_argentina_date()
    all_normalized = []
    category_raw_counts = {}
    category_valid_counts = {}
    total_raw_fetched = 0
    total_valid_contract = 0
    errors = []

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    adapter = requests.adapters.HTTPAdapter(max_retries=3)
    session.mount("https://", adapter)

    market_date = fetch_market_date(session)
    if market_date:
        logging.info(f"Market date fetched from fecha.php: {market_date}")
    else:
        logging.info(f"Market date could not be determined from fecha.php, using today: {today}")

    for cat_id in CATEGORIES:
        try:
            if cat_id > 1:
                time.sleep(1.0)  # Rate limiting delay
            raw_items = fetch_category_data(cat_id, session=session)
            category_raw_counts[cat_id] = len(raw_items)
            total_raw_fetched += len(raw_items)
            valid_in_cat = 0

            if len(raw_items) == 0:
                msg = f"Data Quality ERROR: Category idcat={cat_id} returned 0 records."
                logging.error(msg)
                errors.append(msg)
            
            for item in raw_items:
                if is_valid_contract(item):
                    valid_in_cat += 1
                    total_valid_contract += 1
                    norm = normalize_record(item, category_id=cat_id, snapshot_date=today)
                    all_normalized.append(norm)

            category_valid_counts[cat_id] = valid_in_cat
            cat_ratio = (valid_in_cat / len(raw_items)) if len(raw_items) > 0 else 0.0
            logging.info(f"Category idcat={cat_id}: {valid_in_cat}/{len(raw_items)} valid ({cat_ratio*100:.1f}%)")
            if cat_ratio < MIN_CAT_VALID_RATIO and len(raw_items) > 0:
                msg = f"Data Quality ERROR: Category idcat={cat_id} valid ratio {cat_ratio:.2f} < {MIN_CAT_VALID_RATIO}"
                logging.error(msg)
                errors.append(msg)

        except Exception as e:
            msg = f"Failed fetching category idcat={cat_id}: {e}"
            logging.error(msg)
            errors.append(msg)

    global_ratio = (total_valid_contract / total_raw_fetched) if total_raw_fetched > 0 else 0.0
    logging.info(f"Fetched {total_raw_fetched} raw items total. Valid contract count: {total_valid_contract} ({global_ratio*100:.1f}%)")

    if total_raw_fetched == 0 or global_ratio < MIN_GLOBAL_VALID_RATIO or total_valid_contract < MIN_TOTAL_RECORDS or len(errors) > 0:
        logging.error(f"Data Quality Gate FAILED: global_ratio={global_ratio:.2f}, errors={errors}")
        sys.exit(1)

    if dry_run:
        logging.info(f"DRY RUN complete. Processed {len(all_normalized)} valid price records. Market date: {market_date}")
        logging.info(f"Sample record: {all_normalized[0] if all_normalized else None}")
        return

    # Supabase Client insertion
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logging.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
        sys.exit(1)

    supabase = create_client(supabase_url, supabase_key)

    # 1. Upsert products
    products_map = {}
    for rec in all_normalized:
        prod_key = (rec["original_id"], rec["category_id"])
        if prod_key not in products_map:
            products_map[prod_key] = {
                "original_id": rec["original_id"],
                "name": rec["product_name"],
                "category_id": rec["category_id"]
            }

    products_list = list(products_map.values())
    res_prod = supabase.table("products").upsert(products_list, on_conflict="original_id,category_id").execute()
    
    # Fetch product IDs mapping
    db_prods = supabase.table("products").select("id, original_id, category_id").execute().data
    prod_id_lookup = {(p["original_id"], p["category_id"]): p["id"] for p in db_prods}

    # Stale detection check
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

    # 2. Build price records with product_id
    price_records = []
    for rec in all_normalized:
        pid = prod_id_lookup.get((rec["original_id"], rec["category_id"]))
        if pid:
            price_records.append({
                "snapshot_date": rec["snapshot_date"],
                "product_id": pid,
                "price_from": rec["price_from"],
                "price_to": rec["price_to"],
                "price_avg": rec["price_avg"],
                "origin": rec["origin"],
                "presentation": rec["presentation"],
                "quantity_raw": rec["quantity_raw"]
            })

    # 3. Upsert price_records using Postgres 15 NULLS NOT DISTINCT index constraint
    res_prices = supabase.table("price_records").upsert(
        price_records,
        on_conflict="snapshot_date,product_id,origin,presentation,quantity_raw"
    ).execute()

    log_entry = {
        "snapshot_date": today.isoformat(),
        "status": "SUCCESS",
        "records_inserted": len(price_records),
        "error_message": None
    }
    supabase.table("scraping_logs").insert(log_entry).execute()
    logging.info("Scraping finished successfully.")

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    run_scraper(dry_run=is_dry)
