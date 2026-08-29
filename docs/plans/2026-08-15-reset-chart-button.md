# Restablecer Gráfico Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 'Restablecer gráfico' button to the right of the filters that resets the dashboard view to the default state (Category: 'Todas las categorías', Product: 'Todos los productos', Metric: 'price_avg', clear pinned products), with an extensible helper for future dynamic default view logic.

**Architecture:** 
- Define a central default view configuration helper `getDefaultViewConfig()` in `src/services/dataService.ts`.
- Wire `handleResetChart()` in `App.tsx` to apply this configuration to state variables.
- Pass `onResetChart` to `Filters.tsx` and render a stylized action button with icon to the right of the filters bar.

**Tech Stack:** React, TypeScript, Lucide React (`RotateCcw`), Vanilla CSS design system.

## Global Constraints

- Keep visual layout fluid and responsive.
- Match existing UI theme (`var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`).
- Strict TypeScript compilation with `npx tsc --noEmit`.

---

### Task 1: Add default view helper and reset handler state in App & Filters

**Files:**
- Modify: `src/services/dataService.ts`
- Modify: `src/components/Filters.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Category`, `Product`, `PriceMetric`, `PinnedProduct` from `src/types`
- Produces: `getDefaultViewConfig()`, `onResetChart` callback prop on `Filters`

- [ ] **Step 1: Define `getDefaultViewConfig` in `src/services/dataService.ts`**

```ts
export interface DefaultViewConfig {
  categoryId: number;
  productId: number;
  metric: PriceMetric;
  clearPinned: boolean;
}

export function getDefaultViewConfig(): DefaultViewConfig {
  return {
    categoryId: 0,
    productId: 0,
    metric: 'price_avg',
    clearPinned: true
  };
}
```

- [ ] **Step 2: Add `onResetChart` to `FiltersProps` in `src/components/Filters.tsx` and add button UI**

In `Filters.tsx`:
Add `RotateCcw` from `lucide-react`.
Add `onResetChart: () => void;` to `FiltersProps`.
Add a button "Restablecer gráfico" to the right of the filter controls (or pinned tags bar).

- [ ] **Step 3: Connect `handleResetChart` in `src/App.tsx`**

In `App.tsx`:
```ts
const handleResetChart = () => {
  const defaultConfig = getDefaultViewConfig();
  setSelectedCategory(defaultConfig.categoryId);
  setSelectedProduct(defaultConfig.productId);
  setSelectedMetric(defaultConfig.metric);
  if (defaultConfig.clearPinned) {
    handleClearPinned();
  }
};
```

Pass `onResetChart={handleResetChart}` to `<Filters />`.

- [ ] **Step 4: Verify with TypeScript build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/services/dataService.ts src/components/Filters.tsx src/App.tsx
git commit -m "feat(frontend): add 'Restablecer gráfico' button and default view configuration"
```
