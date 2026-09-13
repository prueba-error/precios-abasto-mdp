# Design Specification: Light Theme Garden Colors ("Paleta Huerta Fresca")

**Date:** 2026-09-13  
**Status:** Approved  
**Branch:** `style/light-theme`

## 1. Overview
Enhance the visual theme (Light & Dark modes) of Abasto Central MDP with a vibrant, organic "Garden Palette" (Paleta Huerta Fresca) inspired by fruits and vegetables. The design improves text contrast, introduces gentle vegetable-tinted backgrounds for headers/footers/cards, and adds high-contrast, colorful buttons for key user interactions.

---

## 2. Color Palette & CSS Variables (`src/index.css`)

### 2.1. Light Theme (`[data-theme="light"]`)
* `--bg-main`: `#f4f8f5` (Soft mint-infused off-white page background)
* `--bg-header-sub`: `#e2efe5` (Gentle leaf green tint for Header, Footer, and Table headers/footers)
* `--bg-card`: `#ffffff` (Clean card backgrounds)
* `--bg-card-hover`: `#eaf4ed` (Hover state background for cards/rows)
* `--border-color`: `#c3dac9` (Soft organic green borders)
* `--text-primary`: `#071a0e` (Deep forest green for ultra-high text contrast)
* `--text-secondary`: `#274731` (Legible secondary text color)
* `--accent-primary`: `#16a34a` (Vibrant leaf green for primary actions/pins)
* `--accent-hover`: `#15803d` (Hover state for leaf green)
* `--accent-orange`: `#ea580c` (Vibrant carrot orange for reset/danger actions)
* `--accent-blue`: `#0284c7` (Clean sky blue for chart lines/indicators)
* `--danger`: `#dc2626`
* `--grid-line`: `#c3dac9`
* `--icon-watermark`: `rgba(22, 163, 74, 0.15)`

### 2.2. Dark Theme (`[data-theme="dark"]`, `:root`)
* `--bg-main`: `#0a120d` (Deep nocturnal forest background)
* `--bg-header-sub`: `#111f17` (Header/Footer dark green tint)
* `--bg-card`: `#14241b` (Dark card background)
* `--bg-card-hover`: `#1c3225` (Dark hover state)
* `--border-color`: `#244231` (Dark green border)
* `--text-primary`: `#f0fdf4` (Crisp light green-white text)
* `--text-secondary`: `#a7f3d0` (Soft mint secondary text)
* `--accent-primary`: `#10b981`
* `--accent-hover`: `#059669`
* `--accent-orange`: `#f97316`
* `--accent-blue`: `#38bdf8`
* `--danger`: `#ef4444`
* `--grid-line`: `#244231`
* `--icon-watermark`: `rgba(167, 243, 208, 0.12)`

---

## 3. Component Design & Button Enhancements

### 3.1. Header & Footer
* Headers and footers utilize `var(--bg-header-sub)` with border `var(--border-color)`.
* Theme Toggle button styled with high-contrast pill border and vegetable tint.

### 3.2. Filter Controls (`src/components/Filters.tsx`)
* **Pin Button**: Vibrant leaf green `#16a34a` with white text/icon and `#15803d` border when idle/hovered.
* **Reset Button**: Carrot orange `#ea580c` with white text/icon and `#c2410c` border when idle/hovered.
* **Category & Product Selectors**: High-contrast borders (`var(--border-color)`), background `var(--bg-card)`, and high legibility text.

### 3.3. Data Tables & Charts (`PriceTable.tsx`, `PriceChart.tsx`, `ProductSearch.tsx`)
* Table headers (`thead`), top controls, and pagination use `var(--bg-header-sub)`.
* Search input and dropdown badges leverage `var(--bg-header-sub)` and `var(--text-secondary)`.
* Chart grid lines use `var(--grid-line)` and tooltip uses `var(--bg-card)` with `var(--border-color)`.

---

## 4. Verification & Testing Criteria
1. `npx tsc --noEmit` compiles cleanly with zero errors.
2. `pytest` passes all 13 unit/integration tests.
3. Light and Dark mode toggling operates smoothly and persists choice in `localStorage`.
