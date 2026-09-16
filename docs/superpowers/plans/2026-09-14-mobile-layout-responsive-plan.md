# Mobile Layout Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile layout distortion on viewports < 640px across Market Insights KPI cards, Header layout, Filters row, and global body overflow.

**Architecture:** Introduce `@media (max-width: 640px)` CSS flexbox/grid responsive rules in `src/index.css`, add explicit CSS class hooks to `Filters.tsx` for layout control, and enforce strict truncation and flex-wrap properties on small viewports.

**Tech Stack:** React 18, TypeScript, CSS3, Vite.

## Global Constraints

- Do not modify existing desktop (> 640px) visual appearance or layouts.
- Retain all existing component interfaces and prop signatures.
- Clean build checks (`npx tsc --noEmit`) and clean pytest run (`.\.venv\Scripts\python.exe -m pytest`).

---

### Task 1: Responsive KPI Cards & Global Containment (`src/index.css`)

**Files:**
- Modify: `src/index.css:40-60`, `src/index.css:515-527`

**Interfaces:**
- Consumes: Existing `.kpi-grid-container`, `.kpi-subcontainer`, `.kpi-group-col1-2`, `.kpi-group-col3-4`, `.kpi-item-name` CSS classes from `MarketInsights.tsx`.
- Produces: Responsive vertical stacking for KPI columns and cards on screens <= 640px with strict text truncation.

- [ ] **Step 1: Add global overflow containment rules**

In `src/index.css`, update `#root`, `body`, and `.container` rules to guarantee zero horizontal scrollbars:

```css
html, body, #root {
  overflow-x: hidden;
  max-width: 100vw;
}

.container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 16px 24px 16px;
  box-sizing: border-box;
}
```

- [ ] **Step 2: Add `@media (max-width: 640px)` media query for Market Insights in `src/index.css`**

Append to `src/index.css`:

```css
/* Mobile Viewport Breakpoint for Market Insights (< 640px) */
@media (max-width: 640px) {
  .market-insights-card {
    padding: 14px;
    gap: 14px;
  }

  .kpi-grid-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .kpi-subcontainer {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .kpi-group-col1-2,
  .kpi-group-col3-4 {
    border-right: none !important;
    padding-right: 0 !important;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 12px;
  }

  .kpi-card-transparent {
    min-height: auto;
  }

  .kpi-item-name {
    max-width: 70%;
  }
}
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style(mobile): add responsive stacking and truncation for market insights KPI cards"
```

---

### Task 2: Responsive Filters Layout & Class Hooks (`src/components/Filters.tsx`, `src/index.css`)

**Files:**
- Modify: `src/components/Filters.tsx:78-202`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `FiltersProps` in `Filters.tsx`.
- Produces: Clean mobile layout where Category, Product select, and Action buttons wrap into predictable rows on screens <= 640px.

- [ ] **Step 1: Add CSS class hooks to `src/components/Filters.tsx`**

Update `src/components/Filters.tsx` flex row container and select items with CSS class names:

```tsx
  return (
    <div className="filters-root" style={{ marginBottom: '24px' }}>
      <div className="filters-flex-row">
        <div className="filter-item-category">
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Categoría</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => onCategoryChange(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: selectedCategory === -1 ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <option value={-1}>— Seleccionar categoría —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="filter-item-product">
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Producto</label>
          <div className="filter-product-controls">
            <select 
              value={selectedProduct} 
              onChange={(e) => onProductChange(Number(e.target.value))}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: selectedProduct === -1 ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              <option value={-1}>— Seleccionar producto —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {(() => {
              const isCleared = pinnedProducts.length === 0 
                ? ((selectedCategory === 0 || selectedCategory === -1) && (selectedProduct === 0 || selectedProduct === -1))
                : (selectedCategory === -1 && selectedProduct === -1);
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (pinnedProducts.length === 0) {
                      onCategoryChange(0);
                      onProductChange(0);
                    } else {
                      onCategoryChange(-1);
                      onProductChange(-1);
                    }
                  }}
                  disabled={isCleared}
                  title={isCleared ? 'Sin selección' : 'Eliminar selección de categoría y producto'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-header-sub)',
                    color: isCleared ? 'var(--text-secondary)' : '#ef4444',
                    cursor: isCleared ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <X size={15} />
                </button>
              );
            })()}
            <button
              onClick={onTogglePin}
              onMouseEnter={() => setIsPinHovered(true)}
              onMouseLeave={() => { setIsPinHovered(false); setIsPinPressed(false); }}
              onMouseDown={() => setIsPinPressed(true)}
              onMouseUp={() => setIsPinPressed(false)}
              title={isCurrentPinned ? 'Desfijar del gráfico' : 'Fijar en el gráfico'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '88px',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: pinStyle.border,
                background: pinStyle.background,
                color: pinStyle.color,
                transform: pinStyle.transform,
                fontWeight: 500,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Pin size={15} fill={isCurrentPinned ? '#ffffff' : 'none'} />
              <span>{isCurrentPinned ? 'Fijado' : 'Fijar'}</span>
            </button>
          </div>
        </div>
        <div className="filter-item-actions">
          <button
            onClick={onResetChart}
            onMouseEnter={() => setIsResetHovered(true)}
            onMouseLeave={() => { setIsResetHovered(false); setIsResetPressed(false); }}
            onMouseDown={() => setIsResetPressed(true)}
            onMouseUp={() => setIsResetPressed(false)}
            title="Restablecer gráfico a la vista por defecto"
            className="filter-reset-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 14px',
              borderRadius: '6px',
              border: resetStyle.border,
              background: resetStyle.background,
              color: resetStyle.color,
              transform: resetStyle.transform,
              fontWeight: 500,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={14} />
            <span>Restablecer gráfico</span>
          </button>
        </div>
      </div>
```

- [ ] **Step 2: Add Filters Responsive CSS in `src/index.css`**

Add to `src/index.css`:

```css
/* Filters Responsive Layout */
.filters-flex-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-item-category {
  flex: 1 1 200px;
}

.filter-item-product {
  flex: 1.2 1 260px;
}

.filter-product-controls {
  display: flex;
  gap: 8px;
}

.filter-item-actions {
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .filters-flex-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-item-category,
  .filter-item-product,
  .filter-item-actions {
    width: 100%;
    flex: 1 1 100%;
  }

  .filter-product-controls {
    width: 100%;
  }

  .filter-reset-btn {
    width: 100%;
  }
}
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Filters.tsx src/index.css
git commit -m "style(mobile): add responsive CSS classes and flex layout rules for Filters component"
```

---

### Task 3: Header Responsive Layout Refinement (`src/index.css`)

**Files:**
- Modify: `src/index.css:201-244`

**Interfaces:**
- Consumes: Header layout elements in `.header-right-group`, `.header-icon-item`, `.header-updated-text`.
- Produces: Non-squished header controls with compact icon size and clean pill alignment on screens <= 640px.

- [ ] **Step 1: Update Header Media Query in `src/index.css`**

Update `@media (max-width: 868px)` and add `@media (max-width: 640px)` refinement for header:

```css
@media (max-width: 640px) {
  .header-right-group {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 6px;
    flex-wrap: wrap;
  }

  .header-icons {
    gap: 4px;
  }

  .header-icon-item {
    width: 20px;
    height: 20px;
  }

  .header-updated-text {
    font-size: 0.7rem;
    padding: 2px 6px;
  }
}
```

- [ ] **Step 2: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style(mobile): refine header controls and date pill spacing for small mobile viewports"
```

---

### Task 4: Complete Build & Test Suite Verification

**Files:**
- Test: Entire codebase

- [ ] **Step 1: Execute TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: Clean output with 0 errors.

- [ ] **Step 2: Execute Pytest test suite**

Run: `.\.venv\Scripts\python.exe -m pytest`
Expected: PASS for all python tests.

- [ ] **Step 3: Verify git working tree state**

Run: `git status`
Expected: Clean working tree on branch `fix/mobile-layout`.
