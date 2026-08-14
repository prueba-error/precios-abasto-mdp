# 🥦 Precios Abasto Central MDP - Tracking & Dashboard

Sistema automatizado de monitoreo, seguimiento histórico y visualización de precios mayoristas del **Mercado de Abasto Central de Mar del Plata** (`https://abastocentralmdp.com.ar/lista-precios`).

---

## 📐 Arquitectura del Sistema

```
[ Abasto Central MDP API ]
  │ POST idcat=1..4 (User-Agent: AbastoPreciosBot/1.0, delay=1s)
  ▼
[ Scraper Python ] (Ejecutado semanalmente via GitHub Actions)
  ├── Validación de Contrato (>90% cat / >95% global con precios válidos)
  │     ├── (ERROR: fallo de red/contrato) ──► Log 'ERROR' en BD + sys.exit(1) ──► Alerta Email GitHub
  │     └── (Pasó validaciones)
  ▼
[ Supabase PostgreSQL 15+ ] (UPSERT Idempotente NULLS NOT DISTINCT)
  │
  ├── REST Data API (SDK Supabase Anon Client)
  ▼
[ Dashboard SPA ] (Vite + React + Recharts en Vercel)
  │ (Soporta VITE_USE_MOCK_DATA=true)
```

---

## 🛠️ Stack Tecnológico

- **Scraper:** Python 3.10+, `requests`, `pytest`, `python-dotenv`.
- **Automatización & CI/CD:** GitHub Actions (Cron semanal `0 9 * * 1` - Lunes 06:00 ART / 09:00 UTC).
- **Base de Datos:** Supabase (PostgreSQL 15+ con `NULLS NOT DISTINCT` y Row Level Security).
- **Dashboard Frontend:** React 18, Vite, Recharts, TypeScript, Lucide Icons, Vanilla CSS.
- **Hosting Frontend:** Vercel.

---

## 📋 Características Clave

1. **Idempotencia Garantizada:** Clave de unicidad en Postgres 15+ con actualización automática de precios (`DO UPDATE`) si la tarea se reejecuta el mismo día.
2. **Quality Gate Dual:** Exige un 90% de validez por categoría y 95% global para prevenir carga de datos corruptos.
3. **Zona Horaria Oficial:** Fecha de lote (`snapshot_date`) fijada en `America/Argentina/Buenos_Aires` (UTC-3).
4. **Etiquetado HTTP Respetuoso:** Identificación con `User-Agent` explícito y retardo prudencial de 1 segundo entre solicitudes.
5. **Modo Demo / Mock Data:** El Dashboard puede operar y ser probado de forma independiente mediante un dataset de 8 semanas de prueba (`VITE_USE_MOCK_DATA=true`).
6. **Seguridad RLS:** Tablas de catálogo/precios con acceso de lectura pública (`anon`); logs administrativos restringidos únicamente a `service_role`.

---

## 🚀 Guía de Inicio Rápido (Local)

### 1. Requisitos Previos
- Python 3.10 o superior
- Node.js 18+ y npm
- Cuenta en Supabase (para ambiente real)

### 2. Configuración del Scraper Python

```bash
# Crear ambiente virtual
python -m venv venv
# Activar en Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Probar scraper en modo seco (sin escribir en base de datos)
python -m scraper.scrape --dry-run

# Ejecutar suite de pruebas unitarias y de parser
pytest tests/
```

### 3. Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto para desarrollo local:

```env
# Variables del Scraper (Python)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Variables del Frontend (React / Vite)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_USE_MOCK_DATA=true
```

### 4. Configuración del Dashboard Frontend

```bash
# Instalar dependencias npm
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El dashboard estará disponible en `http://localhost:5173`.

---

## 🗄️ Estructura de Base de Datos

- **`categories`**: Catálogo fijo de categorías (1: Frutas, 2: Verduras, 3: Hortalizas Pesadas, 4: Otros).
- **`products`**: Productos únicos identificados por `original_id` y `category_id`.
- **`price_records`**: Histórico semanal con precios mínimo (`price_from`), máximo (`price_to`), promedio (`price_avg`), origen y presentación.
- **`scraping_logs`**: Bitácora de auditoría de ejecuciones del scraper.

---

## 📄 Documentación Técnica

- **Especificación Técnica Completa:** [`docs/specs/2026-08-14-abasto-precios-design.md`](docs/specs/2026-08-14-abasto-precios-design.md)
- **Plan de Implementación:** [`docs/plans/2026-08-14-abasto-precios-implementation-plan.md`](docs/plans/2026-08-14-abasto-precios-implementation-plan.md)
