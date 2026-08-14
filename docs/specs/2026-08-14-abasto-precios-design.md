# Especificación Técnica de Proyecto: Sistema de Seguimiento y Visualización de Precios de Abasto Central MDP (v2)

**Fecha:** 2026-08-14  
**Versión:** 2.0 (Revisión de arquitectura, idempotencia y observabilidad)  
**Estado:** Aprobado para implementación  

---

## 1. Visión General y Objetivos

El objetivo de este proyecto es construir un sistema automatizado, resiliente y de bajo mantenimiento para la captura, almacenamiento y visualización histórica de la lista de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

### Objetivos Clave:
1. **Idempotencia y Resiliencia:** Ejecución semanal segura con reintentos. Garantía de no duplicación de datos ante reintentos o ejecuciones manuales.
2. **Validación de Calidad de Datos:** Verificación de contrato y contenido mínimo previo al almacenamiento para evitar corrupción silenciosa si la API responde HTTP 200 con respuestas vacías o alteradas.
3. **Persistencia Estructurada:** Esquema relacional en Supabase (PostgreSQL) con clave de fecha lógica (`snapshot_date`), seguimiento por producto, origen y presentación.
4. **Visualización SPA:** Dashboard interactivo en Vercel (Vite + React + Recharts) con fallback automático a **Mock Data** para desarrollo y testing.
5. **Observabilidad:** Notificación automática vía e-mail de GitHub Actions ante fallos técnicos o de calidad, con bitácora de ejecuciones en la base de datos.

---

## 2. Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST (idcat = 1..4) (3 reintentos con backoff)
  ▼
[ Python Scraper Script ]
  ├── Validación de Contrato & Calidad (Min records > 0, schema ok)
  │     ├── (Falla o Calidad Insuficiente) ──► GitHub Actions Email Alert + `scraping_logs` (ERROR/WARNING)
  │     └── (Pasó validaciones)
  ▼
[ Supabase PostgreSQL (Upsert Idempotente por snapshot_date) ]
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
- **Campos esperados por objeto:**
  `id` (str), `producto` (str), `estado` (str), `categoria` (str), `precio_desde` (str), `precio_hasta` (str), `origen` (str), `presentacion` (str), `cantidad` (str).

### 3.2. Reglas de Validación de Calidad (Data Quality Gate)
Antes de insertar en Supabase, el script verifica:
1. **HTTP Status:** Debe ser 200 OK.
2. **Volumen Mínimo:** Cada categoría (1 a 4) debe retornar $\ge 5$ registros válidos.
3. **Parseo Estructural:** Los objetos deben contener la clave `id` y `producto` no vacíos.

Si alguna de estas condiciones falla, el script registra el evento en `scraping_logs` con estado `ERROR` o `WARNING` y termina con `sys.exit(1)` para disparar la alerta de correo electrónico de GitHub Actions.

### 3.3. Reglas de Normalización y Limpieza
1. **Fecha de Captura Lógica (`snapshot_date`):** Fecha del día en formato `YYYY-MM-DD` (independiente de la hora exacta de ejecución).
2. **Precios (`price_from`, `price_to`):**
   - Valora `"-"` o `""` se convierten en `NULL`.
   - Cadenas numéricas (ej. `"12000"`) se casfean a flotantes/enteros `12000.00`.
3. **Métrica Promedio Derivada (`price_avg`):**
   - Si `price_from` y `price_to` existen: `(price_from + price_to) / 2`.
   - Si solo uno existe: el valor disponible.
   - Si ninguno existe: `NULL`.
4. **Textos (`producto`, `origen`, `presentacion`, `cantidad`):**
   - Normalización de espacios y codificación UTF-8.
   - Reemplazo de `"---"` por `NULL`.

---

## 4. Esquema de Base de Datos (Supabase / PostgreSQL)

### 4.1. DDL Corregido con Idempotencia y Políticas RLS

```sql
-- Habilitar extensión para funciones útiles si se requiere
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO public.categories (id, name) VALUES 
(1, 'Frutas'), (2, 'Verduras'), (3, 'Hortalizas Pesadas'), (4, 'Otros')
ON CONFLICT (id) DO NOTHING;

-- 2. Productos (original_id es NOT NULL para evitar duplicados en SQL por valores NULL)
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    original_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_product_original_category UNIQUE(original_id, category_id)
);

-- 3. Registros Históricos de Precios (Con clave de idempotencia snapshot_date)
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
    -- Restricción UNIQUE para operaciones UPSERT (evita duplicados si el job reintenta el mismo día)
    CONSTRAINT unq_price_record_snapshot UNIQUE (snapshot_date, product_id, origin, presentation, quantity_raw)
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

-- Lectura pública para la SPA (rol anon y authenticated)
CREATE POLICY "Permitir lectura publica de categorias" 
ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de productos" 
ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de precios" 
ON public.price_records FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica de logs" 
ON public.scraping_logs FOR SELECT TO anon, authenticated USING (true);

-- Escritura únicamente permitida para el rol service_role (usado por el scraper en GitHub Actions)
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
- **Estilos:** Vanilla CSS con variables de diseño estructuradas.
- **Cliente Supabase:** `@supabase/supabase-js` utilizando la clave pública `VITE_SUPABASE_ANON_KEY`.

### 5.2. Definición Exacta de Métricas y Variaciones
1. **Métrica Seleccionada:**
   - `Precio Desde`: Grafica/analiza el valor de `price_from`.
   - `Precio Hasta`: Grafica/analiza el valor de `price_to`.
   - `Precio Promedio`: Grafica/analiza `price_avg` = `(price_from + price_to) / 2`.
2. **Variación Porcentual Semanal:**
   $$\Delta\% = \frac{\text{Precio}_{\text{Semana Actual}} - \text{Precio}_{\text{Semana Anterior}}}{\text{Precio}_{\text{Semana Anterior}}} \times 100$$
   - Si falta un dato anterior, la variación se muestra como `N/A`.
3. **Exportación:** Botón para exportar la tabla de datos vista a formato CSV.

### 5.3. Sistema Fallback / Mock Data
Si `VITE_USE_MOCK_DATA=true` o falla la consulta inicial a Supabase:
- El adaptador `src/services/dataService.ts` retorna automáticamente un conjunto de datos estático realista (`src/data/mockData.ts`) que abarca 8 semanas continuas.

---

## 6. Monitoreo, Estrategia de Reintentos y Alertas

1. **Reintentos HTTP:** El script en Python utiliza 3 reintentos con backoff exponencial para fluctuaciones de red.
2. **Ejecución Idempotente:** Operación `UPSERT` en Supabase sobre la clave de unicidad `(snapshot_date, product_id, origin, presentation, quantity_raw)`.
3. **Manejo de Errores y Alerta Mail:**
   - Toda excepción no controlada o fallo en las validaciones de calidad inserta una fila en `scraping_logs` con `status = 'ERROR'` y finaliza el proceso con `exit 1`.
   - GitHub Actions envía una notificación automática por e-mail al administrador del repositorio.

---

## 7. Plan de Cobertura de Pruebas (Testing)

1. **Pruebas Unitarias (`tests/test_normalizer.py`):**
   - Verificación de conversión de precios (`"-"`, `""`, `"15000"`).
   - Verificación del cálculo de `price_avg`.
   - Limpieza de cadenas de texto y UTF-8.
2. **Pruebas de Integración (`tests/test_contract.py`):**
   - Validación de contrato del endpoint real de Abasto Central para detectar cambios estructurales.
3. **Prueba E2E Local:**
   - Ejecución del scraper en modo seco (`--dry-run`) verificando la salida JSON.

---

## 8. Plan de Migraciones y Mantenimiento

- **Migraciones SQL:** Ubicadas en `supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql`.
- **Retención de Logs:** Limpieza automática o retención de `scraping_logs` de los últimos 90 días mediante una función cron/trigger en PostgreSQL si el volumen crece.
