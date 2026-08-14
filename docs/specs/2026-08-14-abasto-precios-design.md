# Especificación Técnica de Proyecto: Sistema de Seguimiento y Visualización de Precios de Abasto Central MDP (v2.2)

**Fecha:** 2026-08-14  
**Versión:** 2.2 (Revisión final de precisión operativa, zona horaria y cálculo de métricas)  
**Estado:** Aprobado para implementación  

---

## 1. Visión General y Objetivos

El objetivo de este proyecto es construir un sistema automatizado, resiliente y de bajo mantenimiento para la captura, almacenamiento y visualización histórica de la lista de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

### Objetivos Clave:
1. **Idempotencia Estricta:** Ejecución semanal segura. Uso de sintaxis PostgreSQL 15 `NULLS NOT DISTINCT` en restricciones de unicidad para evitar duplicación de filas ante ejecuciones repetidas aun cuando existan campos `NULL`.
2. **Validación de Calidad de Datos:** Verificación de contrato y umbral mínimo (Total $\ge 20$ registros y ninguna categoría con 0 registros) previo al almacenamiento para prevenir corrupción silenciosa.
3. **Manejo de Zona Horaria:** Generación de la fecha lógica (`snapshot_date`) fijada explícitamente en zona horaria argentina (`America/Argentina/Buenos_Aires`, UTC-3), independiente del horario UTC del servidor de ejecución.
4. **Persistencia Estructurada y Segura:** Esquema relacional en Supabase (PostgreSQL 15+) con lectura pública restringida únicamente a tablas de catálogo/precios y logs bloqueados a la clave pública `anon`.
5. **Visualización SPA:** Dashboard interactivo en Vercel (Vite + React + Recharts) con fallback automático a **Mock Data** para desarrollo y testing.
6. **Observabilidad y Taxonomía de Alertas:** Clasificación clara entre `WARNING` (se registra en BD pero completa ejecución `exit 0`) y `ERROR` (registra en BD y falla job de GitHub Actions `exit 1` notificando por correo).

---

## 2. Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST (idcat = 1..4) (3 reintentos con backoff)
  ▼
[ Python Scraper Script ] (Timezone: America/Argentina/Buenos_Aires)
  ├── Validación de Contrato & Calidad (Total >= 20 y min >= 1 por categoría)
  │     ├── (ERROR: 0 en cat, total < 20, crash de red) ──► Log 'ERROR' en BD + sys.exit(1) ──► GitHub Email Alert
  │     ├── (WARNING: anomalía menor de precios) ───────► Log 'WARNING' en BD + sys.exit(0)
  │     └── (Pasó validaciones: SUCCESS)
  ▼
[ Supabase PostgreSQL 15+ (Upsert Idempotente NULLS NOT DISTINCT) ]
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

### 3.2. Reglas de Calidad, Zona Horaria y Taxonomía de Errores

1. **Zona Horaria de Snapshot:**
   - La fecha `snapshot_date` se calcula obligatoriamente obteniendo el día actual en la zona horaria `America/Argentina/Buenos_Aires` (ej. `datetime.now(pytz.timezone('America/Argentina/Buenos_Aires')).date()`).

2. **Condiciones de Validación:**
   - Status HTTP = 200 OK.
   - Umbral Estructural Mínimo: Ninguna categoría (1 a 4) puede retornar 0 registros y el total del lote debe ser $\ge 20$ registros.

3. **Taxonomía de Ejecución:**
   - **`SUCCESS`**: Todos los contratos y umbrales cumplidos. Inserta/actualiza datos, registra log `SUCCESS` y termina con `sys.exit(0)`.
   - **`WARNING`**: Se obtienen todos los datos necesarios (total $\ge 20$), pero se detectan anomalías de negocio no destructivas (ej. variaciones de precio $> 100\%$ respecto a la semana previa). Registra log `WARNING` y termina con `sys.exit(0)`.
   - **`ERROR`**: Si falla la red, el status HTTP != 200, si alguna categoría retorna 0 registros o si el total es $< 20$. Registra log `ERROR` y termina con `sys.exit(1)` disparando la alerta de e-mail de GitHub Actions.

### 3.3. Reglas de Normalización y Limpieza
1. **Fecha de Captura Lógica (`snapshot_date`):** Cadena `YYYY-MM-DD` basada en la hora de Argentina.
2. **Precios (`price_from`, `price_to`):**
   - Valores `"-"` o `""` se convierten en `NULL`.
   - Cadenas numéricas (ej. `"12000"`) se castean a flotantes `12000.00`.
3. **Métrica Promedio Derivada (`price_avg`):**
   - Si `price_from` y `price_to` existen: `(price_from + price_to) / 2`.
   - Si solo uno existe: el valor disponible.
   - Si ninguno existe: `NULL`.
4. **Textos (`producto`, `origen`, `presentacion`, `cantidad`):**
   - Normalización de espacios y UTF-8. Reemplazo de `"---"` por `NULL`.

---

## 4. Esquema de Base de Datos (Supabase / PostgreSQL)

### 4.1. Prerrequisitos de Motor y DDL con `NULLS NOT DISTINCT`

> **Nota de Compatibilidad:** La instrucción `NULLS NOT DISTINCT` requiere PostgreSQL 15 o superior (incluido por defecto en Supabase). En entornos Postgres $< 15$, se debe reemplazar la restricción por un índice único expresivo: `CREATE UNIQUE INDEX ON price_records (snapshot_date, product_id, COALESCE(origin, ''), COALESCE(presentation, ''), COALESCE(quantity_raw, ''));`.

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

-- 4. Bitácora de Scraping (Logs)
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

-- -------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- -------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de categorias" 
ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de productos" 
ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de precios" 
ON public.price_records FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Restringir lectura de logs solo a service_role" 
ON public.scraping_logs FOR SELECT TO service_role USING (true);

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

### 5.2. Métricas y Reglas de Variación
1. **Métricas Disponibles:** `Precio Desde`, `Precio Hasta`, `Precio Promedio`.
2. **Variación Porcentual Semanal:**
   $$\Delta\% = \frac{\text{Precio}_{\text{Semana Actual}} - \text{Precio}_{\text{Semana Anterior}}}{\text{Precio}_{\text{Semana Anterior}}} \times 100$$
   - **Regla de Divisor Nulo/Inválido:** Si $\text{Precio}_{\text{Semana Anterior}}$ es `NULL`, `0` o no existe registro previo, la variación porcentual debe retornar obligatoriamente `"N/A"` para evitar errores de división por cero o resultados infinitos.
3. **Exportación:** Botón de descarga de datos en formato CSV.

### 5.3. Sistema Fallback / Mock Data
- Adaptador `src/services/dataService.ts` retorna automáticamente un dataset estático de prueba (`src/data/mockData.ts`) cuando `VITE_USE_MOCK_DATA=true` o cuando la conexión a Supabase no está disponible.

---

## 6. Monitoreo y Estrategia de Reintentos

1. **Reintentos HTTP:** 3 reintentos con backoff exponencial.
2. **Idempotencia SQL:** Clave de unicidad en Postgres 15+ con `NULLS NOT DISTINCT`.
3. **Alertas:** Registro en `scraping_logs` y `sys.exit(1)` ante estados `ERROR` para notificaciones por e-mail de GitHub Actions.

---

## 7. Plan de Cobertura de Pruebas (Testing)

1. **Pruebas Unitarias (`tests/test_normalizer.py`):**
   - Normalización de precios, fecha en timezone `America/Argentina/Buenos_Aires` y cálculo de variación con divisor cero/NULL.
2. **Pruebas con Fixtures (`tests/test_parser.py`):**
   - Parseo de respuestas JSON offline utilizando datos guardados en `tests/fixtures/`.
3. **Prueba Canario de Contrato (`tests/test_canary_contract.py`):**
   - Verificación de esquema contra el servidor real de Abasto Central.

---

## 8. Plan de Migraciones y Mantenimiento

- **Migraciones SQL:** Ubicadas en `supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql`.
- **Limpieza de Logs:** Retención automática de los últimos 90 días en `scraping_logs`.
