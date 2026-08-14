import React from 'react';
import { Category, Product, PriceMetric } from '../types';

interface FiltersProps {
  categories: Category[];
  products: Product[];
  selectedCategory: number;
  selectedProduct: number;
  selectedMetric: PriceMetric;
  onCategoryChange: (catId: number) => void;
  onProductChange: (prodId: number) => void;
  onMetricChange: (metric: PriceMetric) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  categories,
  products,
  selectedCategory,
  selectedProduct,
  selectedMetric,
  onCategoryChange,
  onProductChange,
  onMetricChange
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Categoría</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => onCategoryChange(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Producto</label>
        <select 
          value={selectedProduct} 
          onChange={(e) => onProductChange(Number(e.target.value))}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
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
    </div>
  );
};
