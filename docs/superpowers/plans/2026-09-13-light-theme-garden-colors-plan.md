# Light Theme Garden Colors ("Paleta Huerta Fresca") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Paleta Huerta Fresca" (Garden Palette) across Light and Dark themes for Abasto Central MDP to enhance text contrast, vegetable-tinted backgrounds, and vibrant button interactions.

**Architecture:** Update CSS variables in `src/index.css` to define soft green/mint backgrounds (`--bg-main`, `--bg-header-sub`, `--bg-card-hover`), high-contrast forest green text (`--text-primary`, `--text-secondary`), and vibrant accent colors (`--accent-primary` leaf green `#16a34a`, `--accent-orange` carrot orange `#ea580c`). Update React components (`Filters.tsx`, `Header.tsx`, `PriceTable.tsx`, `ProductSearch.tsx`, `PriceChart.tsx`, `ProductInsights.tsx`) to utilize the new variables.

**Tech Stack:** React 18, TypeScript, CSS Variables, Lucide Icons, Recharts, Vite.

## Global Constraints

- Light theme `[data-theme="light"]`: `--bg-main: #f4f8f5`, `--bg-header-sub: #e2efe5`, `--bg-card: #ffffff`, `--bg-card-hover: #eaf4ed`, `--border-color: #c3dac9`, `--text-primary: #071a0e`, `--text-secondary: #274731`, `--accent-primary: #16a34a`, `--accent-orange: #ea580c`, `--icon-watermark: rgba(22, 163, 74, 0.15)`.
- Dark theme `[data-theme="dark"]`: `--bg-main: #0a120d`, `--bg-header-sub: #111f17`, `--bg-card: #14241b`, `--bg-card-hover: #1c3225`, `--border-color: #244231`, `--text-primary: #f0fdf4`, `--text-secondary: #a7f3d0`, `--icon-watermark: rgba(167, 243, 208, 0.12)`.
- Preserve existing component API contracts and state persistence.

---

### Task 1: CSS Variable Definitions in `src/index.css`

**Files:**
- Modify: `src/index.css:1-35`

**Interfaces:**
- Consumes: Theme selectors (`:root, [data-theme="dark"]`, `[data-theme="light"]`)
- Produces: Updated CSS variable values for background tints, high-contrast forest text, leaf green `#16a34a`, and carrot orange `#ea580c`.

- [ ] **Step 1: Update `src/index.css` with Garden Palette CSS variables**

Update lines 1 to 35 in `src/index.css` to:
```css
:root,
[data-theme="dark"] {
  --bg-main: #0a120d;
  --bg-header-sub: #111f17;
  --bg-card: #14241b;
  --bg-card-hover: #1c3225;
  --border-color: #244231;
  --text-primary: #f0fdf4;
  --text-secondary: #a7f3d0;
  --accent-primary: #10b981;
  --accent-hover: #059669;
  --accent-orange: #f97316;
  --accent-blue: #38bdf8;
  --danger: #ef4444;
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --grid-line: #244231;
  --icon-watermark: rgba(167, 243, 208, 0.12);
}

[data-theme="light"] {
  --bg-main: #f4f8f5;
  --bg-header-sub: #e2efe5;
  --bg-card: #ffffff;
  --bg-card-hover: #eaf4ed;
  --border-color: #c3dac9;
  --text-primary: #071a0e;
  --text-secondary: #274731;
  --accent-primary: #16a34a;
  --accent-hover: #15803d;
  --accent-orange: #ea580c;
  --accent-blue: #0284c7;
  --danger: #dc2626;
  --grid-line: #c3dac9;
  --icon-watermark: rgba(22, 163, 74, 0.15);
}
```

- [ ] **Step 2: Run build type check to verify CSS imports**

Run: `npx tsc --noEmit`
Expected: PASS (exited with code 0)

- [ ] **Step 3: Commit CSS Variable updates**

```bash
git add src/index.css
git commit -m "feat(ui): update CSS variables for Garden Palette light and dark themes"
```

---

### Task 2: Component & Button Styles Refactoring

**Files:**
- Modify: `src/components/Filters.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/PriceTable.tsx`
- Modify: `src/components/ProductSearch.tsx`

**Interfaces:**
- Consumes: CSS variables `--accent-primary`, `--accent-orange`, `--border-color`, `--bg-header-sub`, `--text-primary`, `--text-secondary`.
- Produces: Vibrant, high-contrast button states for Pin (`#16a34a`) and Reset (`#ea580c`), clear headers and card surfaces.

- [ ] **Step 1: Update Pin and Reset button styles in `src/components/Filters.tsx`**

In `src/components/Filters.tsx`, update `getPinStyle` and `getResetStyle`:
```tsx
  const getPinStyle = () => {
    if (isPinPressed) {
      return { background: 'var(--accent-hover)', border: '1px solid var(--accent-hover)', color: '#ffffff', transform: 'scale(0.97)' };
    }
    if (isPinHovered) {
      return { background: 'var(--accent-hover)', border: '1px solid var(--accent-primary)', color: '#ffffff', transform: 'none' };
    }
    return { background: 'var(--accent-primary)', border: '1px solid var(--accent-hover)', color: '#ffffff', transform: 'none' };
  };

  const getResetStyle = () => {
    if (isResetPressed) {
      return { background: '#c2410c', border: '1px solid #ea580c', color: '#ffffff', transform: 'scale(0.97)' };
    }
    if (isResetHovered) {
      return { background: '#c2410c', border: '1px solid #f97316', color: '#ffffff', transform: 'none' };
    }
    return { background: 'var(--accent-orange)', border: '1px solid #c2410c', color: '#ffffff', transform: 'none' };
  };
```

- [ ] **Step 2: Verify component rendering and TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit Component style updates**

```bash
git add src/components/Filters.tsx src/components/Header.tsx src/components/PriceTable.tsx src/components/ProductSearch.tsx
git commit -m "feat(ui): apply Garden Palette vibrant button and header styling"
```

---

### Task 3: Final Verification & Test Suite Check

**Files:**
- Test: Run TypeScript compilation check and Python Pytest suite.

- [ ] **Step 1: Execute TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 2: Execute Pytest suite**

Run: `.\.venv\Scripts\python.exe -m pytest`
Expected: PASS (13 tests passed)

- [ ] **Step 3: Commit any final tweaks if needed**

```bash
git status
```
