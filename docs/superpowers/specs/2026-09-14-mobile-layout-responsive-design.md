# Especificación Técnica: Corrección de Layout Responsive para Dispositivos Móviles

## 1. Diagnóstico del Problema

Al comparar la renderización local en pantallas reducidas (`1-master-local.png`) frente a la vista en smartphones reales (`2-master-deployed.jpg`), se identificaron las siguientes distorsiones visuales en viewports móviles (< 640px):

1. **Colisión y Superposición en Tarjetas de KPIs (Market Insights):**
   - `.kpi-subcontainer` mantiene las columnas en disposición horizontal (`display: flex; gap: 16px`), dividiendo la pantalla de 360px en dos subcolumnas de ~150px.
   - Esto provoca que los nombres de los productos (ej. `1. LECHUGA CRIOLLA INV...`) y los porcentajes (`-60%` o `+483.3%`) se encimen y colisionen horizontalmente.

2. **Aplastamiento del Header y del Toggle/Pill de Fecha:**
   - En `.header-right-group`, los 5 íconos de la cabecera + la pastilla de fecha ("Última act.") + el Toggle de Tema intentan caber en una única fila horizontal.
   - En pantallas de 360px, el ancho acumulado (~350px) excede el espacio disponible (328px), colapsando la pastilla de fecha y distorsionando el toggle.

3. **Desbordamiento de Controles de Filtro (Filters):**
   - Los selectores de Categoría y Producto con `flex: 1.2 1 260px` junto con los botones `[X]`, `[Fijar]` y `[Restablecer]` superan el ancho móvil, generando saltos de línea irregulares.

---

## 2. Solución Propuesta y Arquitectura CSS Responsive

### A. Componente `MarketInsights.tsx` / `index.css`
* En `@media (max-width: 640px)`:
  - `.kpi-grid-container`: Cambia a `display: flex; flex-direction: column; gap: 14px;`.
  - `.kpi-subcontainer`: Cambia a `flex-direction: column; gap: 12px; border-right: none !important; padding-right: 0 !important;`.
  - `.kpi-item-name`: Agrega truncamiento defensivo (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;`).
  - `.kpi-list-item`: Asegura alineación flexible `justify-content: space-between` para que el porcentaje nunca se encime con el texto.

### B. Componente `Header.tsx` / `index.css`
* En `@media (max-width: 640px)`:
  - `.header-container`: `flex-direction: column; align-items: stretch; gap: 10px;`.
  - `.header-left-group`: Stack vertical completo del título y la barra de búsqueda (100% width).
  - `.header-right-group`: Disposición en fila con `justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 8px;`.
  - `.header-icon-item`: Reduce el tamaño de los íconos de cabecera a `20px × 20px`.
  - Pastilla de Fecha + Toggle: Se empaquetan en un contenedor con `gap: 6px` y `flex-shrink: 0`.

### C. Componente `Filters.tsx` / `index.css`
* En `@media (max-width: 640px)`:
  - Selector de Categoría: `width: 100%; flex: 1 1 100%;`.
  - Selector de Producto: `width: 100%; flex: 1 1 100%;`.
  - Botones `[Fijar]` y `[Restablecer]`: Se agrupan en una fila inferior de ancho completo (`width: 100%; display: flex; gap: 8px;`).

### D. Protección de Overflow y Contención Global
* En `index.css`:
  - `#root`, `body`, `.container`: `overflow-x: hidden; width: 100%;`.
