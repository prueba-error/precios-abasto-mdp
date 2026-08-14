# Abasto Precios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated weekly price scraper (Python + GitHub Actions) for Abasto Central MDP, store normalized price records in Supabase (PostgreSQL with `NULLS NOT DISTINCT` idempotency), and serve a dynamic SPA dashboard hosted on Vercel using Vite, React, and Recharts with built-in mock data fallback.

**Architecture:** A Python script in GitHub Actions periodically fetches price payloads from Abasto Central MDP via POST, normalizes data, and executes an idempotent `UPSERT` on Supabase. A Vite + React + Recharts SPA reads data via Supabase JS SDK (or falls back to mock data if offline) and renders interactive time-series price charts and tables.

**Tech Stack:** Python 3.10+, Supabase (PostgreSQL 15), GitHub Actions, Vite, React 18, Recharts, TypeScript, Vanilla CSS.

## Global Constraints

- Platform: Windows local workspace, Linux GitHub Actions runner, Vercel SPA hosting.
- PostgreSQL 15 `NULLS NOT DISTINCT` for composite unique index idempotency.
- Database access: RLS enabled on all tables; `anon` role restricted to SELECT on `categories`, `products`, `price_records`; `scraping_logs` restricted to `service_role`.
- Charting: Recharts library only.

---

### Task 1: Supabase Database Migration Setup

**Files:**
- Create: `supabase/migrations/20260814000000_init_schema.sql`

**Interfaces:**
- Consumes: PostgreSQL DDL from spec v2.1
- Produces: Database tables (`categories`, `products`, `price_records`, `scraping_logs`) and RLS policies.

- [ ] **Step 1: Create migration file with complete DDL**

Create file `supabase/migrations/20260814000000_init_schema.sql`:
```sql
-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO public.categories (id, name) VALUES 
(1, 'Frutas'), (2, 'Verduras'), (3, 'Hortalizas Pesadas'), (4, 'Otros')
ON CONFLICT (id) DO NOTHING;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    original_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_product_original_category UNIQUE(original_id, category_id)
);

-- 3. Historical Price Records Table with Postgres 15 NULLS NOT DISTINCT idempotency
CREATE TABLE IF NOT EXISTS public.price_records (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price_from NUMERIC(12,2),
    price_to NUMERIC(12,2),
    price_avg NUMERIC(12,2),
    origin VARCHAR(100),
    presentation VARCHAR(100),
    quantity_raw VARCHAR(100),
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_price_record_snapshot UNIQUE NULLS NOT DISTINCT (snapshot_date, product_id, origin, presentation, quantity_raw)
);

CREATE INDEX IF NOT EXISTS idx_price_records_product_snapshot 
ON public.price_records(product_id, snapshot_date DESC);

-- 4. Scraping Audit Logs Table
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id BIGSERIAL PRIMARY KEY,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'WARNING', 'ERROR')),
    records_inserted INT DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scraping_logs_executed 
ON public.scraping_logs(executed_at DESC);

-- RLS Configuration
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de categorias" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir lectura publica de productos" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir lectura publica de precios" ON public.price_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Restringir lectura de logs solo a service_role" ON public.scraping_logs FOR SELECT TO service_role USING (true);

CREATE POLICY "Permitir escritura completa a service_role en categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura completa a service_role en products" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura completa a service_role en price_records" ON public.price_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escritura completa a service_role en scraping_logs" ON public.scraping_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Commit SQL migration**

```bash
git add supabase/migrations/20260814000000_init_schema.sql
git commit -m "feat(db): add initial PostgreSQL 15 schema and RLS policies"
```

---

### Task 2: Python Scraper Normalizer & Test Suite

**Files:**
- Create: `scraper/__init__.py`
- Create: `scraper/normalizer.py`
- Create: `tests/test_normalizer.py`

**Interfaces:**
- Consumes: Raw dict from API response object
- Produces: `clean_price_val(val)`, `calculate_avg(price_from, price_to)`, `normalize_record(raw_dict, category_id, snapshot_date)`

- [ ] **Step 1: Write failing unit test for normalizer**

Create file `tests/test_normalizer.py`:
```python
import pytest
from datetime import date
from scraper.normalizer import clean_price_val, calculate_avg, normalize_record

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
```

- [ ] **Step 2: Run test to verify failure**

Run: `pytest tests/test_normalizer.py`
Expected: FAIL (ModuleNotFoundError: No module named 'scraper')

- [ ] **Step 3: Implement `scraper/normalizer.py`**

Create `scraper/__init__.py` (empty file).
Create `scraper/normalizer.py`:
```python
import re
from datetime import date
from typing import Optional, Dict, Any

def clean_price_val(val: Optional[str]) -> Optional[float]:
    if not val:
        return None
    cleaned = val.strip()
    if cleaned in ("-", "", "---"):
        return None
    # Remove thousand separators or currency signs if any
    cleaned = cleaned.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None

def calculate_avg(p_from: Optional[float], p_to: Optional[float]) -> Optional[float]:
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
    cleaned = text.strip()
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_normalizer.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scraper/ tests/
git commit -m "feat(scraper): add data normalizer and unit test suite"
```

---

### Task 3: Python Scraper Execution Engine & Data Quality Gate

**Files:**
- Create: `scraper/scrape.py`
- Create: `tests/fixtures/sample_api_response.json`
- Create: `tests/test_parser.py`
- Create: `requirements.txt`

**Interfaces:**
- Consumes: Abasto Central MDP API POST endpoints & Supabase credentials
- Produces: `run_scraper(dry_run: bool = False)` function and CLI execution script

- [ ] **Step 1: Create test fixture and test parser**

Create `tests/fixtures/sample_api_response.json`:
```json
[
  {
    "id": "198",
    "producto": "MANDARINA OKITSU",
    "estado": "1",
    "categoria": "Frutas",
    "precio_desde": "-",
    "precio_hasta": "12000",
    "origen": "ENTRE RIOS",
    "presentacion": "CAJON",
    "cantidad": "18 KG."
  },
  {
    "id": "27",
    "producto": "MANGO",
    "estado": "1",
    "categoria": "Frutas",
    "precio_desde": "15000",
    "precio_hasta": "",
    "origen": "BRASIL",
    "presentacion": "CAJA",
    "cantidad": "12 UNIDADES"
  }
]
```

Create `tests/test_parser.py`:
```python
import json
from pathlib import Path
from datetime import date
from scraper.normalizer import normalize_record

def test_parse_fixture_records():
    fixture_path = Path(__file__).parent / "fixtures" / "sample_api_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert len(data) == 2
    today = date(2026, 8, 14)
    records = [normalize_record(item, category_id=1, snapshot_date=today) for item in data]
    
    assert records[0]["product_name"] == "MANDARINA OKITSU"
    assert records[1]["product_name"] == "MANGO"
    assert records[1]["price_from"] == 15000.0
```

- [ ] **Step 2: Create `requirements.txt`**

Create `requirements.txt`:
```
requests>=2.28.0
supabase>=1.0.0
python-dotenv>=1.0.0
pytest>=7.0.0
```

- [ ] **Step 3: Implement `scraper/scrape.py`**

Create `scraper/scrape.py`:
```python
import os
import sys
import json
import logging
import requests
from datetime import date
from typing import List, Dict, Any
from scraper.normalizer import normalize_record

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

API_URL = "https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php"
CATEGORIES = [1, 2, 3, 4]
MIN_RECORDS_PER_CAT = 5

def fetch_category_data(category_id: int) -> List[Dict[str, Any]]:
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(max_retries=3)
    session.mount("https://", adapter)
    
    response = session.post(API_URL, data={"idcat": category_id}, timeout=15)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        raise ValueError(f"Expected list response for idcat={category_id}, got {type(data)}")
    return data

def run_scraper(dry_run: bool = False) -> None:
    today = date.today()
    all_normalized = []
    total_records = 0
    errors = []

    for cat_id in CATEGORIES:
        try:
            raw_items = fetch_category_data(cat_id)
            if len(raw_items) < MIN_RECORDS_PER_CAT:
                msg = f"Category idcat={cat_id} returned {len(raw_items)} records (expected >= {MIN_RECORDS_PER_CAT})"
                logging.warning(msg)
                errors.append(msg)
            
            for item in raw_items:
                if item.get("id") and item.get("producto"):
                    norm = normalize_record(item, category_id=cat_id, snapshot_date=today)
                    all_normalized.append(norm)
        except Exception as e:
            msg = f"Failed fetching category idcat={cat_id}: {e}"
            logging.error(msg)
            errors.append(msg)

    total_records = len(all_normalized)
    logging.info(f"Total normalized records collected: {total_records}")

    if total_records == 0:
        logging.error("Data Quality Gate FAILED: Zero records collected.")
        sys.exit(1)

    if dry_run:
        logging.info(f"DRY RUN complete. Sample record: {all_normalized[0] if all_normalized else None}")
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

    status = "SUCCESS" if not errors else "WARNING"
    log_entry = {
        "snapshot_date": today.isoformat(),
        "status": status,
        "records_inserted": len(price_records),
        "error_message": "; ".join(errors) if errors else None
    }
    supabase.table("scraping_logs").insert(log_entry).execute()
    logging.info("Scraping finished successfully.")

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    run_scraper(dry_run=is_dry)
```

- [ ] **Step 4: Run dry run check**

Run: `python -m scraper.scrape --dry-run`
Expected: Logs output fetching categories and successfully normalizing ~100+ records.

- [ ] **Step 5: Commit**

```bash
git add scraper/ requirements.txt tests/
git commit -m "feat(scraper): implement execution engine and data quality gate"
```

---

### Task 4: GitHub Actions Workflow Configuration

**Files:**
- Create: `.github/workflows/scrape_precios.yml`

**Interfaces:**
- Runs: Weekly GitHub cron job with secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/scrape_precios.yml`:
```yaml
name: Scrape Precios Abasto Central

on:
  schedule:
    # Run every Monday at 09:00 UTC (06:00 ART)
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.10
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run Unit & Parser Tests
        run: |
          pytest tests/

      - name: Execute Scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          python -m scraper.scrape
```

- [ ] **Step 2: Commit workflow**

```bash
git add .github/workflows/scrape_precios.yml
git commit -m "ci: add weekly github actions scraper workflow"
```

---

### Task 5: Frontend Vite + React + Recharts Setup & Design Tokens

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.tsx`

- [ ] **Step 1: Create `package.json`**

Create `package.json`:
```json
{
  "name": "abasto-precios-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
```

- [ ] **Step 2: Create Vite and TS configuration files**

Create `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `index.html` and `src/index.css` design system**

Create `index.html`:
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Evolución de Precios - Abasto Central MDP</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/index.css`:
```css
:root {
  --bg-main: #0f172a;
  --bg-card: #1e293b;
  --bg-card-hover: #334155;
  --border-color: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent-primary: #10b981;
  --accent-hover: #059669;
  --accent-blue: #3b82f6;
  --danger: #ef4444;
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: var(--font-family);
  min-height: 100vh;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
```

- [ ] **Step 4: Commit frontend scaffolding**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/
git commit -m "feat(frontend): setup vite react project structure and design tokens"
```

---

### Task 6: Mock Data & Data Service Layer

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/mockData.ts`
- Create: `src/services/dataService.ts`

**Interfaces:**
- Consumes: Supabase anon client / Mock dataset
- Produces: `fetchCategories()`, `fetchProducts(categoryId)`, `fetchPriceHistory(productId, metric)`

- [ ] **Step 1: Create `src/types/index.ts`**

Create `src/types/index.ts`:
```ts
export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  original_id: string;
  name: string;
  category_id: number;
}

export interface PriceRecord {
  id: number;
  snapshot_date: string;
  product_id: number;
  price_from: number | null;
  price_to: number | null;
  price_avg: number | null;
  origin: string | null;
  presentation: string | null;
  quantity_raw: string | null;
}

export type PriceMetric = 'price_avg' | 'price_from' | 'price_to';
```

- [ ] **Step 2: Create `src/data/mockData.ts`**

Create `src/data/mockData.ts`:
```ts
import { Category, Product, PriceRecord } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Frutas' },
  { id: 2, name: 'Verduras' },
  { id: 3, name: 'Hortalizas Pesadas' },
  { id: 4, name: 'Otros' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 101, original_id: '198', name: 'MANDARINA OKITSU', category_id: 1 },
  { id: 102, original_id: '27', name: 'MANGO', category_id: 1 },
  { id: 103, original_id: '29', name: 'MANZANA DELICIOSA', category_id: 1 },
  { id: 201, original_id: '57', name: 'ACELGA', category_id: 2 },
  { id: 202, original_id: '65', name: 'LECHUGA CAPUCHINA', category_id: 2 }
];

const dates = ['2026-06-22', '2026-06-29', '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10'];

export const MOCK_PRICE_RECORDS: PriceRecord[] = [
  // Mandarina Okitsu history
  { id: 1, snapshot_date: dates[0], product_id: 101, price_from: 9000, price_to: 10000, price_avg: 9500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 2, snapshot_date: dates[1], product_id: 101, price_from: 9500, price_to: 10500, price_avg: 10000, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 3, snapshot_date: dates[2], product_id: 101, price_from: 10000, price_to: 11000, price_avg: 10500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 4, snapshot_date: dates[3], product_id: 101, price_from: 10500, price_to: 11500, price_avg: 11000, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 5, snapshot_date: dates[4], product_id: 101, price_from: 11000, price_to: 12000, price_avg: 11500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 6, snapshot_date: dates[5], product_id: 101, price_from: 11500, price_to: 12000, price_avg: 11750, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 7, snapshot_date: dates[6], product_id: 101, price_from: 12000, price_to: 12500, price_avg: 12250, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  { id: 8, snapshot_date: dates[7], product_id: 101, price_from: 12000, price_to: 13000, price_avg: 12500, origin: 'ENTRE RIOS', presentation: 'CAJON', quantity_raw: '18 KG.' },
  
  // Acelga history
  { id: 9, snapshot_date: dates[0], product_id: 201, price_from: 7000, price_to: 8000, price_avg: 7500, origin: 'ZONA', presentation: 'JAULA', quantity_raw: '10 PAQUETES' },
  { id: 10, snapshot_date: dates[7], product_id: 201, price_from: 10000, price_to: 11000, price_avg: 10500, origin: 'ZONA', presentation: 'JAULA', quantity_raw: '10 PAQUETES' }
];
```

- [ ] **Step 3: Create `src/services/dataService.ts`**

Create `src/services/dataService.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
import { Category, Product, PriceRecord } from '../types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_PRICE_RECORDS } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !supabaseUrl;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export async function getCategories(): Promise<Category[]> {
  if (useMock || !supabase) return MOCK_CATEGORIES;
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error || !data) return MOCK_CATEGORIES;
  return data;
}

export async function getProducts(categoryId: number): Promise<Product[]> {
  if (useMock || !supabase) {
    return MOCK_PRODUCTS.filter(p => p.category_id === categoryId);
  }
  const { data, error } = await supabase.from('products').select('*').eq('category_id', categoryId).order('name');
  if (error || !data) return MOCK_PRODUCTS.filter(p => p.category_id === categoryId);
  return data;
}

export async function getPriceHistory(productId: number): Promise<PriceRecord[]> {
  if (useMock || !supabase) {
    return MOCK_PRICE_RECORDS.filter(r => r.product_id === productId).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  }
  const { data, error } = await supabase.from('price_records').select('*').eq('product_id', productId).order('snapshot_date', { ascending: true });
  if (error || !data) return MOCK_PRICE_RECORDS.filter(r => r.product_id === productId);
  return data;
}
```

- [ ] **Step 4: Commit data service**

```bash
git add src/
git commit -m "feat(frontend): add TypeScript types, mock data, and Supabase data service"
```

---

### Task 7: Recharts UI Components & Main App Integration

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Filters.tsx`
- Create: `src/components/PriceChart.tsx`
- Create: `src/components/PriceTable.tsx`
- Create: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create Header component**

Create `src/components/Header.tsx`:
```tsx
import React from 'react';
import { TrendingUp, Database } from 'lucide-react';

interface HeaderProps {
  isMock: boolean;
  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TrendingUp color="#10b981" size={32} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visualizador de Precios Mayoristas</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Database size={16} />
          <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act: ${lastUpdated || 'Hoy'}`}</span>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Create Filters component**

Create `src/components/Filters.tsx`:
```tsx
import React from 'react';
import { Category, Product, PriceMetric } from '../types';

interface FiltersProps {
  categories: Category[];
  products: Product[];
  selectedCategory: number;
  selectedProduct: number;
  selectedMetric: PriceMetric;
  onCategoryChange: (catId: number) => void;
  onProductChange: (prodId: number) => void;
  onMetricChange: (metric: PriceMetric) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  categories,
  products,
  selectedCategory,
  selectedProduct,
  selectedMetric,
  onCategoryChange,
  onProductChange,
  onMetricChange
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Categoría</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => onCategoryChange(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Producto</label>
        <select 
          value={selectedProduct} 
          onChange={(e) => onProductChange(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Métrica de Precio</label>
        <select 
          value={selectedMetric} 
          onChange={(e) => onMetricChange(e.target.value as PriceMetric)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          <option value="price_avg">Precio Promedio</option>
          <option value="price_from">Precio Desde</option>
          <option value="price_to">Precio Hasta</option>
        </select>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create PriceChart component with Recharts**

Create `src/components/PriceChart.tsx`:
```tsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PriceRecord, PriceMetric } from '../types';

interface PriceChartProps {
  records: PriceRecord[];
  metric: PriceMetric;
  productName: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ records, metric, productName }) => {
  const metricLabel = metric === 'price_avg' ? 'Promedio' : metric === 'price_from' ? 'Mínimo' : 'Máximo';

  const chartData = records.map(r => ({
    date: r.snapshot_date,
    precio: r[metric]
  }));

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>Evolución: {productName} ({metricLabel})</h3>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" unit="$" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(val: number) => [`$${val?.toLocaleString()}`, metricLabel]}
            />
            <Line type="monotone" dataKey="precio" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create PriceTable component**

Create `src/components/PriceTable.tsx`:
```tsx
import React from 'react';
import { PriceRecord } from '../types';

interface PriceTableProps {
  records: PriceRecord[];
}

export const PriceTable: React.FC<PriceTableProps> = ({ records }) => {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#0f172a' }}>
            <th style={{ padding: '12px' }}>Fecha</th>
            <th style={{ padding: '12px' }}>Desde</th>
            <th style={{ padding: '12px' }}>Hasta</th>
            <th style={{ padding: '12px' }}>Promedio</th>
            <th style={{ padding: '12px' }}>Origen</th>
            <th style={{ padding: '12px' }}>Presentación</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px' }}>{r.snapshot_date}</td>
              <td style={{ padding: '12px' }}>{r.price_from ? `$${r.price_from.toLocaleString()}` : '-'}</td>
              <td style={{ padding: '12px' }}>{r.price_to ? `$${r.price_to.toLocaleString()}` : '-'}</td>
              <td style={{ padding: '12px', fontWeight: 600, color: '#10b981' }}>{r.price_avg ? `$${r.price_avg.toLocaleString()}` : '-'}</td>
              <td style={{ padding: '12px' }}>{r.origin || '-'}</td>
              <td style={{ padding: '12px' }}>{r.presentation || '-'} ({r.quantity_raw || ''})</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 5: Assemble `src/App.tsx` and `src/main.tsx`**

Create `src/App.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { PriceTable } from './components/PriceTable';
import { Category, Product, PriceRecord, PriceMetric } from './types';
import { getCategories, getProducts, getPriceHistory } from './services/dataService';

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<number>(101);
  const [selectedMetric, setSelectedMetric] = useState<PriceMetric>('price_avg');

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getProducts(selectedCategory).then(prods => {
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProduct(prods[0].id);
        } else {
          setRecords([]);
        }
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedProduct) {
      getPriceHistory(selectedProduct).then(recs => setRecords(recs));
    }
  }, [selectedProduct]);

  const activeProduct = products.find(p => p.id === selectedProduct);

  return (
    <div className="container">
      <Header isMock={true} />
      <Filters 
        categories={categories}
        products={products}
        selectedCategory={selectedCategory}
        selectedProduct={selectedProduct}
        selectedMetric={selectedMetric}
        onCategoryChange={setSelectedCategory}
        onProductChange={setSelectedProduct}
        onMetricChange={setSelectedMetric}
      />
      {records.length > 0 && activeProduct ? (
        <>
          <PriceChart records={records} metric={selectedMetric} productName={activeProduct.name} />
          <PriceTable records={records} />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          No hay datos de precios disponibles para la selección actual.
        </div>
      )}
    </div>
  );
}
export default App;
```

Create `src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Commit complete UI application**

```bash
git add src/
git commit -m "feat(frontend): assemble Recharts dashboard UI with interactive filters and tables"
```

---

Plan complete and saved to `docs/plans/2026-08-14-abasto-precios-implementation-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
