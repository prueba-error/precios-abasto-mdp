import React from 'react';
import { Category, Product, PriceMetric, PinnedProduct } from '../types';
import { Pin, X, Trash2, RotateCcw } from 'lucide-react';
import { ProductSearch } from './ProductSearch';

interface FiltersProps {
  categories: Category[];
  products: Product[];
  allProducts: Product[];
  selectedCategory: number;
  selectedProduct: number;
  pinnedProducts: PinnedProduct[];
  isCurrentPinned: boolean;
  hoveredSeries?: string | null;
  onCategoryChange: (catId: number) => void;
  onProductChange: (prodId: number) => void;
  onTogglePin: () => void;
  onUnpinProduct: (pinnedId: string) => void;
  onClearPinned: () => void;
  onResetChart: () => void;
  onSelectProductFromSearch: (product: Product) => void;
  onPinProductFromSearch?: (product: Product) => void;
  onHoverSeries?: (seriesName: string | null) => void;
  onSelectProductItem?: (productId?: number, productName?: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  categories,
  products,
  allProducts,
  selectedCategory,
  selectedProduct,
  pinnedProducts,
  isCurrentPinned,
  hoveredSeries,
  onCategoryChange,
  onProductChange,
  onTogglePin,
  onUnpinProduct,
  onClearPinned,
  onResetChart,
  onSelectProductFromSearch,
  onPinProductFromSearch,
  onHoverSeries,
  onSelectProductItem
}) => {
  const [isPinHovered, setIsPinHovered] = React.useState(false);
  const [isPinPressed, setIsPinPressed] = React.useState(false);
  
  const [isResetHovered, setIsResetHovered] = React.useState(false);
  const [isResetPressed, setIsResetPressed] = React.useState(false);

  // Compute Fijar/Fijado button styles dynamically based on state
  const getPinStyle = () => {
    if (isPinPressed) {
      return { background: 'var(--btn-pin-hover)', border: '1px solid var(--btn-pin-hover)', color: '#ffffff', transform: 'scale(0.97)' };
    }
    if (isPinHovered) {
      return { background: 'var(--btn-pin-hover)', border: '1px solid var(--btn-pin-hover)', color: '#ffffff', transform: 'none' };
    }
    return { background: 'var(--btn-pin-bg)', border: '1px solid var(--btn-pin-bg)', color: '#ffffff', transform: 'none' };
  };

  // Compute Restablecer button styles dynamically based on state
  const getResetStyle = () => {
    if (isResetPressed) {
      return { background: 'var(--btn-reset-hover)', border: '1px solid var(--btn-reset-hover)', color: '#ffffff', transform: 'scale(0.97)' };
    }
    if (isResetHovered) {
      return { background: 'var(--btn-reset-hover)', border: '1px solid var(--btn-reset-hover)', color: '#ffffff', transform: 'none' };
    }
    return { background: 'var(--btn-reset-bg)', border: '1px solid var(--btn-reset-bg)', color: '#ffffff', transform: 'none' };
  };

  const pinStyle = getPinStyle();
  const resetStyle = getResetStyle();

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

      {pinnedProducts.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fijados en gráfico:</span>
          {pinnedProducts.map(p => {
            const isHovered = hoveredSeries === p.productName;
            const isAnyHovered = !!hoveredSeries;
            return (
              <div
                key={p.pinnedId}
                onMouseEnter={() => onHoverSeries?.(p.productName)}
                onMouseLeave={() => onHoverSeries?.(null)}
                onClick={() => onSelectProductItem?.(p.productId, p.productName)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'var(--bg-card)',
                  border: isHovered ? `1px solid ${p.color}` : `1px solid ${p.color}`,
                  boxShadow: isHovered ? `0 0 8px ${p.color}60` : 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: isHovered ? 600 : 500,
                  opacity: isAnyHovered ? (isHovered ? 1 : 0.4) : 1,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }}></span>
                <span>{p.productName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpinProduct(p.pinnedId);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  title="Desfijar"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          <button
            onClick={onClearPinned}
            style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
          >
            <Trash2 size={12} />
            <span>Limpiar todos</span>
          </button>
        </div>
      )}
    </div>
  );
};
