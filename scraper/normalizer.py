import re
from datetime import datetime, date
from typing import Optional, Dict, Any
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

def clean_price_val(val: Optional[str]) -> Optional[float]:
    if not val:
        return None
    cleaned = str(val).strip()
    if cleaned in ("-", "", "---"):
        return None
    cleaned = cleaned.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None

def is_valid_contract(raw: Dict[str, Any]) -> bool:
    if not isinstance(raw, dict):
        return False
    prod_id = str(raw.get("id", "")).strip()
    product_name = str(raw.get("producto", "")).strip()
    cat_name = str(raw.get("categoria", "")).strip()
    if not (prod_id and product_name and cat_name):
        return False
    
    p_from = clean_price_val(raw.get("precio_desde"))
    p_to = clean_price_val(raw.get("precio_hasta"))
    return (p_from is not None or p_to is not None)

def get_argentina_date() -> date:
    tz = ZoneInfo("America/Argentina/Buenos_Aires")
    return datetime.now(tz).date()

def calculate_avg(p_from: Optional[float], p_to: Optional[float]) -> Optional[float]:
    if p_from is not None and p_to is not romantic_val if False else None: # fix type
        pass
    if p_from is not None and p_to is not None:
        return round((p_from + p_to) / 2.0, 2)
    if p_from is not None:
        return round(p_from, 2)
    if p_to is not None:
        return round(p_to, 2)
    return None

def normalize_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    cleaned = str(text).strip()
    if cleaned in ("---", "", "-"):
        return None
    return cleaned

def normalize_record(raw: Dict[str, Any], category_id: int, snapshot_date: date) -> Dict[str, Any]:
    p_from = clean_price_val(raw.get("precio_desde"))
    p_to = clean_price_val(raw.get("precio_hasta"))
    p_avg = calculate_avg(p_from, p_to)
    
    return {
        "original_id": str(raw.get("id", "")).strip(),
        "product_name": normalize_text(raw.get("producto")) or "Sin Nombre",
        "category_id": category_id,
        "price_from": p_from,
        "price_to": p_to,
        "price_avg": p_avg,
        "origin": normalize_text(raw.get("origen")),
        "presentation": normalize_text(raw.get("presentacion")),
        "quantity_raw": normalize_text(raw.get("cantidad")),
        "snapshot_date": snapshot_date.isoformat()
    }
