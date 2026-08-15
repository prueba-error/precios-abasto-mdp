# Product Search Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product search bar above the filters section on branch `feature/product-search-bar` that allows searching all products via an interactive combobox with a floating matches list, updating `selectedCategory` and `selectedProduct` when a valid product is chosen.

**Architecture:**
- Create `src/components/ProductSearch.tsx` combobox component with search icon, input field, and floating matches dropdown.
- Update `src/services/dataService.ts` if helper functions to fetch all products across categories are needed.
- Update `src/components/Filters.tsx` to include `ProductSearch` above the filter controls grid.
- Wire `handleSelectProductFromSearch` in `src/App.tsx`.

**Tech Stack:** React, TypeScript, Lucide React (`Search`), Vanilla CSS.

## Global Constraints

- Must run on branch `feature/product-search-bar`.
- Match existing UI dark theme palette (`var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`).
- Selecting from search updates active selection ONLY (does NOT pin).
- Zero TypeScript errors (`npx tsc --noEmit`).

---

### Task 1: Create `ProductSearch` Combobox component and wire data flow in App & Filters

**Files:**
- Create: `src/components/ProductSearch.tsx`
- Modify: `src/components/Filters.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Product`, `Category` from `src/types`
- Produces: `<ProductSearch />` component and `onSelectProduct(product: Product)` handler in `App.tsx`

- [ ] **Step 1: Create `src/components/ProductSearch.tsx`**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Product, Category } from '../types';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  allProducts: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  allProducts,
  categories,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const filteredProducts = normalizedQuery === '' 
    ? [] 
    : allProducts.filter(p => {
        if (p.id === 0) return false; // exclude basket generic options from search list
        const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nameNorm.includes(normalizedQuery);
      });

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const handleSelect = (prod: Product) => {
    onSelectProduct(prod);
    setQuery(prod.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '16px', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
        Buscar producto
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Escribe el nombre de un producto..."
          style={{
            width: '100%',
            padding: '9px 36px 9px 36px',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && filteredProducts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '240px',
            overflowY: 'auto',
            background: '#1e293b',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          {filteredProducts.map(p => {
            const catName = getCategoryName(p.category_id);
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                {catName && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>
                    {catName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Update `Filters.tsx` to include `ProductSearch`**

Add `allProducts: Product[]` and `onSelectProductFromSearch: (product: Product) => void;` to `FiltersProps`.
Render `<ProductSearch allProducts={allProducts} categories={categories} onSelectProduct={onSelectProductFromSearch} />` above the filters grid.

- [ ] **Step 3: Wire product search selection in `src/App.tsx`**

In `App.tsx`:
Fetch and maintain `allProductsList` (all products across all categories) using `getProducts(0, categories)`.
Define:
```tsx
const handleSelectProductFromSearch = (product: Product) => {
  setSelectedCategory(product.category_id);
  setSelectedProduct(product.id);
};
```
Pass `allProducts={allProductsList}` and `onSelectProductFromSearch={handleSelectProductFromSearch}` to `<Filters />`.

- [ ] **Step 4: Verify with TypeScript build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/ProductSearch.tsx src/components/Filters.tsx src/App.tsx
git commit -m "feat(frontend): add product search combobox bar above filters"
```
