# Especificación Técnica de Proyecto: Sistema de Seguimiento y Visualización de Precios de Abasto Central MDP (v2.1)

**Fecha:** 2026-08-14  
**Versión:** 2.1 (Revisión de unicidad en Postgres 15, seguridad de RLS y taxonomía de errores)  
**Estado:** Aprobado para implementación  

---

## 1. Visión General y Objetivos

El objetivo de este proyecto es construir un sistema automatizado, resiliente y de bajo mantenimiento para la captura, almacenamiento y visualización histórica de la lista de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

### Objetivos Clave:
1. **Idempotencia Estricta:** Ejecución semanal segura. Uso de sintaxis PostgreSQL 15 `NULLS NOT DISTINCT` en restricciones de unicidad para evitar duplicación de filas ante ejecuciones repetidas aun cuando existan campos `NULL`.
2. **Validación de Calidad de Datos:** Verificación de contrato y umbral mínimo ($\ge 5$ registros por categoría) previo al almacenamiento para prevenir corrupción silenciosa.
3. **Persistencia Estructurada y Segura:** Esquema relacional en Supabase (PostgreSQL) con lectura pública restringida únicamente a tablas de catálogo/precios y logs bloqueados a la clave pública `anon`.
4. **Visualización SPA:** Dashboard interactivo en Vercel (Vite + React + Recharts) con fallback automático a **Mock Data** para desarrollo y testing.
5. **Observabilidad y Taxonomía de Alertas:** Clasificación clara entre `WARNING` (se registra en BD pero completa ejecución) y `ERROR` (registra en BD y falla job de GitHub Actions notificando por correo).

---

## 2. Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST (idcat = 1..4) (3 reintentos con backoff)
  ▼
[ Python Scraper Script ]
  ├── Validación de Contrato & Calidad (Min >= 5 registros por categoría)
  │     ├── (ERROR: 0 registros, crash de red) ──► Log 'ERROR' en BD + sys.exit(1) ──► GitHub Email Alert
  │     ├── (WARNING: anomalía menor) ───────────► Log 'WARNING' en BD + sys.exit(0)
  │     └── (Pasó validaciones: SUCCESS)
  ▼
[ Supabase PostgreSQL (Upsert Idempotente NULLS NOT DISTINCT) ]
  │
  ├── Data API (REST / SDK Supabase Anon Client)
  ▼
[ Dashboard SPA (Vite + React + Recharts) ] ──► Host en Vercel
  │ (Soporta VITE_USE_MOCK_DATA=true)
```

---

## 3. Especificación del Scraper (Python + GitHub Actions)

### 3.1. Endpoint Origen y Contrato
- **URL Endpoint:** `https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php`
- **Método HTTP:** `POST`
- **Payloads:** `idcat=1` (Frutas), `idcat=2` (Verduras), `idcat=3` (Hortalizas Pesadas), `idcat=4` (Otros).
- **Campos esperados por objeto:** `id` (str), `producto` (str), `estado` (str), `categoria` (str), `precio_desde` (str), `precio_hasta` (str), `origen` (str), `presentacion` (str), `cantidad` (str).

### 3.2. Reglas de Calidad y Taxonomía de Errores

1. **Condiciones de Validación:**
   - Status HTTP = 200 OK.
   - Umbral mínimo: Cada categoría (1 a 4) debe retornar $\ge 5$ registros válidos (mínimo 20 registros en total).
   - Estructura válida con `id` y `producto` no vacíos.

2. **Taxonomía de Ejecución:**
   - **`SUCCESS`**: Todos los contratos y umbrales cumplidos. Inserta/actualiza datos, registra log `SUCCESS` y termina con `sys.exit(0)`.
   - **`WARNING`**: Se obtienen registros pero se detecta alguna discrepancia menor (ej. variaciones atípicas o 1 categoría con menos de 5 registros pero datos parciales útiles). Registra log `WARNING` y termina con `sys.exit(0)`.
   - **`ERROR`**: Fallo total de red, cambio drástico de esquema o 0 registros retornados. Registra log `ERROR` y termina con `sys.exit(1)` disparando la alerta de e-mail de GitHub Actions.

### 3.3. Reglas de Normalización y Limpieza
1. **Fecha de Captura Lógica (`snapshot_date`):** Fecha del día en formato `YYYY-MM-DD`.
2. **Precios (`price_from`, `price_to`):**
   - Valores `"-"` o `""` se convierten en `NULL`.
   - Cadenas numéricas (ej. `"12000"`) se castean a flotantes `12000.00`.
3. **Métrica Promedio Derivada (`price_avg`):**
   - Si `price_from` y `price_to` existen: `(price_from + price_to) / 2`.
   - Si solo uno existe: el valor disponible.
   - Si ninguno existe: `NULL`.
4. **Textos (`producto`, `origen`, `presentacion`, `cantidad`):**
   - Normalización de espacios y UTF-8.
   - Reemplazo de `"---"` por `NULL`.

---

## 4. Esquema de Base de Datos (Supabase / PostgreSQL)

### 4.1. DDL Corregido con `NULLS NOT DISTINCT` (PostgreSQL 15+) y RLS Ajustado

```sql
-- 1. Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO public.categories (id, name) VALUES 
(1, 'Frutas'), (2, 'Verduras'), (3, 'Hortalizas Pesadas'), (4, 'Otros')
ON CONFLICT (id) DO NOTHING;

-- 2. Productos
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    original_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_product_original_category UNIQUE(original_id, category_id)
);

-- 3. Registros Históricos de Precios
-- Utiliza NULLS NOT DISTINCT (PostgreSQL 15+) para evitar duplicados en UPSERT cuando origin/presentation son NULL
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

-- 4. Bitácora de Scraping (Logs)
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

-- -------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- -------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs ENABLE ROW LEVEL SECURITY;

-- Lectura pública para la SPA (únicamente datos de negocio)
CREATE POLICY "Permitir lectura publica de categorias" 
ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de productos" 
ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de precios" 
ON public.price_records FOR SELECT TO anon, authenticated USING (true);

-- SEGURIDAD: scraping_logs NO es accesible de forma pública por anon
CREATE POLICY "Restringir lectura de logs solo a service_role" 
ON public.scraping_logs FOR SELECT TO service_role USING (true);

-- Escritura únicamente permitida para el rol service_role (scraper)
CREATE POLICY "Permitir escritura completa a service_role en categories" 
ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Permitir escritura completa a service_role en products" 
ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Permitir escritura completa a service_role en price_records" 
ON public.price_records FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Permitir escritura completa a service_role en scraping_logs" 
ON public.scraping_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 5. Dashboard de Visualización (Vite + React + Recharts)

### 5.1. Stack Técnico
- **Framework:** React 18+ empacado con Vite.
- **Librería de Gráficos:** Recharts.
- **Estilos:** Vanilla CSS estructurado.
- **Cliente Supabase:** `@supabase/supabase-js` con `VITE_SUPABASE_ANON_KEY`.

### 5.2. Métricas y Variaciones
1. **Métricas Disponibles:** `Precio Desde`, `Precio Hasta`, `Precio Promedio`.
2. **Variación Porcentual Semanal:**
   $$\Delta\% = \frac{\text{Precio}_{\text{Semana Actual}} - \text{Precio}_{\text{Semana Anterior}}}{\text{Precio}_{\text{Semana Anterior}}} \times 100$$
3. **Exportación:** Botón de descarga de datos en formato CSV.

### 5.3. Sistema Fallback / Mock Data
- Adaptador `src/services/dataService.ts` retorna automáticamente un dataset estático de prueba (`src/data/mockData.ts`) cuando `VITE_USE_MOCK_DATA=true` o cuando la conexión a Supabase no está disponible.

---

## 6. Monitoreo y Estrategia de Reintentos

1. **Reintentos HTTP:** 3 reintentos con backoff exponencial.
2. **Idempotencia SQL:** Clave de unicidad en Postgres 15 con `NULLS NOT DISTINCT`.
3. **Alertas:** Registro en `scraping_logs` y `sys.exit(1)` ante estados `ERROR` para notificaciones por e-mail de GitHub Actions.

---

## 7. Plan de Cobertura de Pruebas (Testing)

1. **Pruebas Unitarias (`tests/test_normalizer.py`):**
   - Normalización de precios, métrica promedio y saneamiento UTF-8 (ejecutado en CI).
2. **Pruebas con Fixtures (`tests/test_parser.py`):**
   - Parseo de respuestas JSON offline utilizando datos guardados en `tests/fixtures/` (ejecutado en CI).
3. **Prueba Canario de Contrato (`tests/test_canary_contract.py`):**
   - Verificación de esquema contra el servidor real de Abasto Central (ejecutada en cron separado o previo a deployments).

---

## 8. Plan de Migraciones y Mantenimiento

- **Migraciones SQL:** Ubicadas en `supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql`.
- **Limpieza de Logs:** Retención automática de los últimos 90 días en `scraping_logs`.
