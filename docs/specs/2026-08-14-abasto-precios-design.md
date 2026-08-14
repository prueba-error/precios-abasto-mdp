# Especificación Técnica de Proyecto: Sistema de Seguimiento y Visualización de Precios de Abasto Central MDP

**Fecha:** 2026-08-14  
**Estado:** Aprobado para implementación  
**Propósito:** Documento base de arquitectura y referencia para la captura semanal de precios y visualización histórica mediante Dashboard SPA.

---

## 1. Visión General y Objetivos

El objetivo de este proyecto es construir un sistema automatizado de bajo costo/gratuito para la captura, almacenamiento y visualización histórica de la lista de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

### Objetivos Clave:
1. **Automatización:** Extracción semanal periódica sin intervención manual mediante GitHub Actions.
2. **Persistencia:** Almacenamiento estructurado en Supabase (PostgreSQL) con seguimiento histórico de precios por producto, origen y presentación.
3. **Visualización:** Dashboard SPA ágil en Vercel con gráficos interactivos de series temporales (Vite + React + Recharts).
4. **Soporte Offline/Mock:** Capacidad de probar e iterar la interfaz con datos simulados antes de tener datos acumulados.
5. **Observabilidad:** Notificaciones automáticas por correo electrónico si la API falla o cambia su formato, con bitácora de ejecuciones en la base de datos.

---

## 2. Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST (idcat = 1..4)
  ▼
[ Python Scraper Script ] ──(Excepción)──► GitHub Actions Email Alert
  │                                    └──► Supabase `scraping_logs` (ERROR)
  │ (Inserción normalizada)
  ▼
[ Supabase PostgreSQL ]
  │
  ├── Data API (REST / Client JS)
  ▼
[ Dashboard SPA (Vite + React + Recharts) ] ──► Host en Vercel
  │ (Soporta VITE_USE_MOCK_DATA=true)
```

---

## 3. Extracción de Datos (Scraper Python + GitHub Actions)

### 3.1. Endpoint Origen
- **URL Endpoint:** `https://abastocentralmdp.com.ar/dws/dws-app/pages/precios/back/precios.php`
- **Método HTTP:** `POST`
- **Payloads (`form-data` / `x-www-form-urlencoded`):**
  - `idcat=1` (Frutas)
  - `idcat=2` (Verduras)
  - `idcat=3` (Hortalizas Pesadas)
  - `idcat=4` (Otros)

### 3.2. Reglas de Normalización de Datos
1. **Precios (`precio_desde`, `precio_hasta`):**
   - Valores `"-"` o `""` se convierten en `NULL`.
   - Cadenas numéricas (ej. `"12000"`) se convierten a valores flotantes/enteros `12000.00`.
2. **Textos (`producto`, `origen`, `presentacion`, `cantidad`):**
   - Eliminación de espacios en blanco sobrantes (`strip()`).
   - Normalización de codificación UTF-8 (decodificar secuencias como `\u00d1` -> `Ñ`).
   - Reemplazo de `"---"` por `NULL` en campos secundarios.

### 3.3. GitHub Actions Workflow (`.github/workflows/scrape.yml`)
- **Frecuencia:** Cron semanal (ej. `0 9 * * 1` - Todos los lunes a las 09:00 UTC).
- **Ejecución:**
  - Instala dependencias (`requests`, `supabase-py`, `python-dotenv`).
  - Corre script `scraper/scrape.py`.
  - En caso de código de salida distitno de cero (`exit 1`), GitHub Actions envía automáticamente un e-mail de fallo al propietario del repositorio.

---

## 4. Esquema de Base de Datos (Supabase / PostgreSQL)

### 4.1. DDL de Tablas

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
    original_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    category_id INT REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(original_id, name, category_id)
);

-- 3. Registros Históricos de Precios
CREATE TABLE IF NOT EXISTS public.price_records (
    id BIGSERIAL PRIMARY KEY,
    product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
    price_from NUMERIC(12,2),
    price_to NUMERIC(12,2),
    origin VARCHAR(100),
    presentation VARCHAR(100),
    quantity_raw VARCHAR(100),
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_records_product_date 
ON public.price_records(product_id, scraped_at DESC);

-- 4. Bitácora de Scraping (Logs)
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id BIGSERIAL PRIMARY KEY,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('SUCCESS', 'WARNING', 'ERROR')),
    records_inserted INT DEFAULT 0,
    error_message TEXT
);
```

### 4.2. Políticas de Seguridad (RLS)
- Lectura pública (`anon`): Permitida para `categories`, `products`, `price_records`.
- Escritura: Restringida únicamente al ROL de servicio de Supabase (`service_role key`), utilizado por el script de Python en GitHub Actions.

---

## 5. Dashboard de Visualización (Vite + React + Recharts)

### 5.1. Estructura del Frontend
- **Framework:** React 18+ empacado con Vite.
- **Librería de Gráficos:** Recharts.
- **Estilos:** CSS Vanilla estructurado / CSS Modules para máxima velocidad de carga.
- **Despliegue:** Vercel (conectado al repositorio de GitHub).

### 5.2. Componentes Clave
1. **Header & Bar Status:** Muestra la fecha de última actualización exitosa e indicador de estado del servicio.
2. **Filtros de Búsqueda:**
   - Selector de Categoría.
   - Selector de Producto.
   - Selector de Rango Temporal (Último mes, 3 meses, 6 meses, 1 año, Todo el historial).
   - Selector de Métrica (Precio Desde, Precio Hasta, Promedio).
3. **Gráfico Evolutivo Principal:** Gráfico de líneas interactivas con tooltip explicativo.
4. **Tabla de Resumen & Variación:** Muestra la variación porcentual semanal (subida/baja) y precios mínimos/máximos registrados.

### 5.3. Sistema de Mock Data
Para poder usar y probar la aplicación antes de que la base de datos acumule semanas de información:
- Se creará un archivo `src/data/mockData.ts` con una muestra realista de 8 semanas de datos históricos.
- Un servicio adaptador (`src/services/dataService.ts`) detectará la variable `VITE_USE_MOCK_DATA` o fallará limpiamente a los datos mock si la conexión con Supabase no está configurada aún.

---

## 6. Monitoreo y Sistema de Alertas

1. **Captura de Excepciones:**
   - Si la API responde con un status HTTP $\ge 400$, o el HTML/JSON retornado no coincide con el esquema esperado, el script guarda un registro en `scraping_logs` con `status = 'ERROR'` y la traza del error.
2. **Notificación por Mail:**
   - El script ejecuta `sys.exit(1)` en caso de falla.
   - GitHub Actions captura el código de salida de falla y envía una alerta por e-mail nativo a la cuenta de GitHub asociada.

---

## 7. Plan de Implementación (Fases)

- **Fase 1:** Configuración inicial del repositorio en GitHub, documento spec y base de datos Supabase.
- **Fase 2:** Desarrollo del Frontend SPA en Vite + React con datos Mock y gráficos Recharts. Despliegue en Vercel.
- **Fase 3:** Desarrollo del script de scraping en Python, pruebas de normalización e integración con Supabase.
- **Fase 4:** Configuración del workflow de GitHub Actions, secrets de Supabase y validación de alertas.
