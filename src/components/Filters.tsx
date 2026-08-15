import React from 'react';
import { Category, Product, PriceMetric, PinnedProduct } from '../types';
import { Pin, X, Trash2, RotateCcw } from 'lucide-react';

interface FiltersProps {
  categories: Category[];
  products: Product[];
  selectedCategory: number;
  selectedProduct: number;
  selectedMetric: PriceMetric;
  pinnedProducts: PinnedProduct[];
  isCurrentPinned: boolean;
  onCategoryChange: (catId: number) => void;
  onProductChange: (prodId: number) => void;
  onMetricChange: (metric: PriceMetric) => void;
  onTogglePin: () => void;
  onUnpinProduct: (pinnedId: string) => void;
  onClearPinned: () => void;
  onResetChart: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  categories,
  products,
  selectedCategory,
  selectedProduct,
  selectedMetric,
  pinnedProducts,
  isCurrentPinned,
  onCategoryChange,
  onProductChange,
  onMetricChange,
  onTogglePin,
  onUnpinProduct,
  onClearPinned,
  onResetChart
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Categoría</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => onCategoryChange(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1.2 1 260px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Producto</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={selectedProduct} 
              onChange={(e) => onProductChange(Number(e.target.value))}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              onClick={onTogglePin}
              title={isCurrentPinned ? 'Desfijar del gráfico' : 'Fijar en el gráfico'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: isCurrentPinned ? '1px solid #60a5fa' : '1px solid #3b82f6',
                background: isCurrentPinned ? '#2563eb' : 'rgba(37, 99, 235, 0.25)',
                color: isCurrentPinned ? '#ffffff' : '#93c5fd',
                fontWeight: 600,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Pin size={15} fill={isCurrentPinned ? '#ffffff' : 'none'} />
              <span>{isCurrentPinned ? 'Fijado' : 'Fijar'}</span>
            </button>
          </div>
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Métrica de Precio</label>
          <select 
            value={selectedMetric} 
            onChange={(e) => onMetricChange(e.target.value as PriceMetric)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <option value="price_avg">Precio Promedio</option>
            <option value="price_from">Precio Desde</option>
            <option value="price_to">Precio Hasta</option>
          </select>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <button
            onClick={onResetChart}
            title="Restablecer gráfico a la vista por defecto"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 14px',
              borderRadius: '6px',
              border: '1px solid #f87171',
              background: 'rgba(220, 38, 38, 0.25)',
              color: '#fca5a5',
              fontWeight: 600,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s'
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
          {pinnedProducts.map(p => (
            <div
              key={p.pinnedId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: `1px solid ${p.color}`,
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }}></span>
              <span>{p.productName}</span>
              <button
                onClick={() => onUnpinProduct(p.pinnedId)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title="Desfijar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
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
