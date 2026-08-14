# Especificación Técnica de Proyecto: Sistema de Seguimiento y Visualización de Precios de Abasto Central MDP (v2.4)

**Fecha:** 2026-08-14  
**Versión:** 2.4 (Revisión de validez analítica de precios, SQL canónico de UPSERT y umbral por categoría)  
**Estado:** Aprobado para implementación  

---

## 1. Visión General y Objetivos

El objetivo de este proyecto es construir un sistema automatizado, resiliente y de bajo mantenimiento para la captura, almacenamiento y visualización histórica de la lista de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

### Objetivos Clave:
1. **Idempotencia Estricta:** Ejecución semanal segura. Uso de sintaxis PostgreSQL 15 `NULLS NOT DISTINCT` en restricciones de unicidad con sentencia canónica `INSERT ... ON CONFLICT DO UPDATE`.
2. **Validación de Contrato y Validez Analítica:** Verificación de campos estructurales (`id`, `producto`, `categoria`) y analíticos (al menos un precio válido `precio_desde` o `precio_hasta`).
3. **Umbrales Duales de Calidad:** Tolerancia de registros válidos de al menos el **90% en cada categoría** individual y el **95% en el total global** (mínimo 20 registros totales).
4. **Manejo de Zona Horaria:** Fecha lógica (`snapshot_date`) fijada en zona horaria argentina (`America/Argentina/Buenos_Aires`, UTC-3).
5. **Persistencia Estructurada y Segura:** Esquema relacional en Supabase (PostgreSQL 15+) con lectura pública restringida a tablas de negocio y `scraping_logs` bloqueado a `anon`.
6. **Visualización SPA:** Dashboard interactivo en Vercel (Vite + React + Recharts) con fallback automático a **Mock Data**.
7. **Observabilidad:** Alertas `WARNING` (con guardarraíl de 2 semanas de historial) y `ERROR` (fallos estructurales o de contrato `exit 1`).

---

## 2. Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST (idcat = 1..4) (3 reintentos con backoff)
  ▼
[ Python Scraper Script ] (Timezone: America/Argentina/Buenos_Aires)
  ├── Validación de Contrato (>90% cat / >95% global con al menos 1 precio) & Calidad (Total >= 20)
  │     ├── (ERROR: <90% cat, <95% global, 0 en cat, total < 20, crash) ──► Log 'ERROR' + sys.exit(1) ──► Email Alert
  │     ├── (WARNING: anomalía con >= 2 registros previos) ──────────────► Log 'WARNING' + sys.exit(0)
  │     └── (Pasó validaciones: SUCCESS)
  ▼
[ Supabase PostgreSQL 15+ (UPSERT CANÓNICO ON CONFLICT DO UPDATE) ]
  │
  ├── Data API (REST / SDK Supabase Anon Client)
  ▼
[ Dashboard SPA (Vite + React + Recharts) ] ──► Host en Vercel
  │ (Soporta VITE_USE_MOCK_DATA=true)
```

---

## 3. Especificación del Scraper (Python + GitHub Actions)

### 3.1. Endpoint Origen y Contrato Estricto
- **URL Endpoint:** `https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php`
- **Método HTTP:** `POST`
- **Payloads:** `idcat=1` (Frutas), `idcat=2` (Verduras), `idcat=3` (Hortalizas Pesadas), `idcat=4` (Otros).
- **Criterio de Registro Válido (Estructural + Analítico):**
  1. Campos obligatorios no vacíos: `id`, `producto`, `categoria`.
  2. Validez analítica: Al menos uno de los campos `precio_desde` o `precio_hasta` debe contener un valor numérico parseable válido (diferente de `"-"`, `""` o `"---"`).

### 3.2. Reglas de Calidad, Umbrales Duales y Taxonomía
1. **Umbrales Duales de Tolerancia:**
   - **Por categoría:** Al menos el **90%** de los registros de cada categoría deben ser válidos.
   - **Global:** Al menos el **95%** del total acumulado de los registros procesados debe ser válido.
   - **Mínimo Absoluto:** Ninguna categoría con 0 registros y total de registros procesados $\ge 20$.

2. **Taxonomía de Ejecución y Guardarraíles de Alerta:**
   - **`SUCCESS`**: Todos los contratos y umbrales cumplidos. Registra log `SUCCESS` y finaliza con `sys.exit(0)`.
   - **`WARNING`**: Registra log `WARNING` (`sys.exit(0)`) solo si se detecta una variación de precio mayor al $100\%$ sobre un producto que posea **al menos 2 semanas de historial previo** y precio anterior $> 0$.
   - **`ERROR`**: Fallo de red, status HTTP != 200, $<90\%$ validez en alguna categoría, $<95\%$ validez global o total $< 20$. Registra log `ERROR` y termina con `sys.exit(1)` (dispara e-mail en GitHub Actions).

---

## 4. Esquema de Base de Datos y Sentencia Canónica UPSERT

### 4.1. Sentencia Canónica de UPSERT
Cuando el scraper inserta lote de datos en `price_records`, utiliza la siguiente instrucción SQL en PostgreSQL 15+:

```sql
INSERT INTO public.price_records (
    snapshot_date, product_id, price_from, price_to, price_avg, origin, presentation, quantity_raw
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (snapshot_date, product_id, origin, presentation, quantity_raw)
DO UPDATE SET 
    price_from = EXCLUDED.price_from,
    price_to = EXCLUDED.price_to,
    price_avg = EXCLUDED.price_avg,
    scraped_at = EXCLUDED.scraped_at;
```

### 4.2. DDL de Creación
```sql
CREATE TABLE IF NOT EXISTS public.categories (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO public.categories (id, name) VALUES 
(1, 'Frutas'), (2, 'Verduras'), (3, 'Hortalizas Pesadas'), (4, 'Otros')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    original_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_product_original_category UNIQUE(original_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.price_records (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id BIGSERIAL PRIMARY KEY,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    snapshot_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'WARNING', 'ERROR')),
    records_inserted INT DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scraping_logs_executed 
ON public.scraping_logs(executed_at DESC);

-- POLÍTICAS RLS
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

---

## 5. Dashboard de Visualización (Vite + React + Recharts)

### 5.1. Stack Técnico
- **Framework:** React 18+ empacado con Vite.
- **Librería de Gráficos:** Recharts.
- **Estilos:** Vanilla CSS estructurado.
- **Cliente Supabase:** `@supabase/supabase-js` con `VITE_SUPABASE_ANON_KEY`.

### 5.2. Métricas y Reglas de Variación
1. **Métricas Disponibles:** `Precio Desde`, `Precio Hasta`, `Precio Promedio`.
2. **Variación Porcentual Semanal:**
   $$\Delta\% = \frac{\text{Precio}_{\text{Semana Actual}} - \text{Precio}_{\text{Semana Anterior}}}{\text{Precio}_{\text{Semana Anterior}}} \times 100$$
   - **Regla de Divisor Nulo/Inválido:** Si $\text{Precio}_{\text{Semana Anterior}}$ es `NULL`, `0` o no existe registro previo, la variación retorna `"N/A"`.
3. **Exportación:** Botón de descarga de datos en formato CSV.

### 5.3. Sistema Fallback / Mock Data
- Adaptador `src/services/dataService.ts` retorna automáticamente el dataset estático de prueba (`src/data/mockData.ts`) cuando `VITE_USE_MOCK_DATA=true` o falla la conexión a Supabase.

---

## 6. Monitoreo y Estrategia de Reintentos

1. **Reintentos HTTP:** 3 reintentos con backoff exponencial.
2. **Idempotencia SQL:** Clave de unicidad Postgres 15+ `NULLS NOT DISTINCT` actualizando `price_from`, `price_to`, `price_avg`, `scraped_at`.
3. **Alertas:** Registro en `scraping_logs` y `sys.exit(1)` ante estados `ERROR` para notificaciones por e-mail de GitHub Actions.

---

## 7. Plan de Cobertura de Pruebas (Testing)

1. **Pruebas Unitarias (`tests/test_normalizer.py`):**
   - Normalización de precios, validación de validez analítica y umbrales duales (90% cat / 95% global), fecha en timezone `America/Argentina/Buenos_Aires` y divisor cero.
2. **Pruebas con Fixtures (`tests/test_parser.py`):**
   - Parseo de respuestas JSON offline utilizando datos guardados en `tests/fixtures/`.
3. **Prueba Canario de Contrato (`tests/test_canary_contract.py`):**
   - Verificación de esquema contra el servidor real de Abasto Central.

---

## 8. Plan de Migraciones y Mantenimiento

- **Migraciones SQL:** Ubicadas en `supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql`.
- **Limpieza de Logs:** Retención automática de los últimos 90 días en `scraping_logs`.
