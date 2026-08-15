import os
import sys
import time
import json
import logging
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from scraper.normalizer import normalize_record, get_argentina_date, is_valid_contract

# Load environment variables from .env file if present
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

API_URL = "https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php"
USER_AGENT = "AbastoPreciosBot/1.0 (+https://github.com/Diegolas/scraping-verduras)"
CATEGORIES = [1, 2, 3, 4]
MIN_TOTAL_RECORDS = 20
MIN_GLOBAL_VALID_RATIO = 0.70
MIN_CAT_VALID_RATIO = 0.60

def fetch_category_data(category_id: int) -> List[Dict[str, Any]]:
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

    for cat_id in CATEGORIES:
        try:
            if cat_id > 1:
                time.sleep(1.0)  # Rate limiting delay
            raw_items = fetch_category_data(cat_id)
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
        logging.info(f"DRY RUN complete. Processed {len(all_normalized)} valid price records.")
        logging.info(f"Sample record: {all_normalized[0] if all_normalized else None}")
        return

    # Supabase Client insertion
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logging.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
        sys.exit(1)

    from supabase import create_client
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
