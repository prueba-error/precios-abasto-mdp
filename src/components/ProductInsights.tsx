import React from 'react';
import { Product } from '../types';
import { ProductInsightsData } from '../utils/insightsUtils';
import { TrendingUp, TrendingDown, BarChart2, Ruler, Sparkles } from 'lucide-react';

interface ProductInsightsProps {
  selectedProduct: Product | undefined;
  data: ProductInsightsData;
}

export const ProductInsights: React.FC<ProductInsightsProps> = ({ selectedProduct, data }) => {
  // If no product is selected or if Basket Option (id === 0) is selected, hide individual product insights
  if (!selectedProduct || selectedProduct.id === 0) {
    return null;
  }

  const isVariationPositive = (data.variationPercent || 0) >= 0;

  return (
    <section className="product-insights-card">
      {/* 1. Cabecera del Producto (Product Header - Sin icono) */}
      <div className="product-insights-header">
        <div className="product-title-block">
          <h3 className="product-name">{selectedProduct.name}</h3>
          <span className="product-subtitle">producto seleccionado</span>
        </div>
      </div>

      {/* 2. Grilla de Métricas e Insights (Metrics & Insights Row) */}
      <div className="product-metrics-grid">
        {/* Columna 1: Precio Actual */}
        <div className="product-metric-col">
          <span className="metric-label">Precio actual</span>
          <span className="metric-value-primary">
            {data.currentPrice !== null ? `$${data.currentPrice.toLocaleString('es-AR')}` : 'N/D'}
            {data.presentation ? <span className="metric-unit"> / {data.presentation}</span> : ''}
          </span>
        </div>

        {/* Columna 2: Variación vs último registro */}
        <div className="product-metric-col">
          <span className="metric-label">Vs último registro</span>
          <span className="metric-value-large" style={{ color: isVariationPositive ? '#ef4444' : '#10b981' }}>
            {data.variationPercent !== null ? (isVariationPositive ? `+${data.variationPercent}%` : `${data.variationPercent}%`) : '0%'}
          </span>
        </div>

        {/* Columna 3: Mínimo Histórico */}
        <div className="product-metric-col">
          <span className="metric-label">Mínimo histórico</span>
          <span className="metric-value-medium">
            {data.minPrice !== null ? `$${data.minPrice.toLocaleString('es-AR')}` : 'N/D'}
          </span>
          <span className="metric-subtext">{data.minDate || 'N/D'}</span>
        </div>

        {/* Columna 4: Máximo Histórico */}
        <div className="product-metric-col">
          <span className="metric-label">Máximo histórico</span>
          <span className="metric-value-medium">
            {data.maxPrice !== null ? `$${data.maxPrice.toLocaleString('es-AR')}` : 'N/D'}
          </span>
          <span className="metric-subtext">{data.maxDate || 'N/D'}</span>
        </div>

        {/* Columna 5: Lista de Insights Contextuales (Fondo transparente, sin padding) */}
        <div className="product-contextual-col-clean">
          <div className="contextual-item">
            {data.consecutiveTrendType === 'up' ? (
              <TrendingUp size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            ) : data.consecutiveTrendType === 'down' ? (
              <TrendingDown size={15} color="#10b981" style={{ flexShrink: 0 }} />
            ) : (
              <Sparkles size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
            )}
            <span>
              {data.consecutiveTrendType === 'up'
                ? `Subiendo hace ${data.consecutiveTrendWeeks} semanas seguidas`
                : data.consecutiveTrendType === 'down'
                ? `Bajando hace ${data.consecutiveTrendWeeks} semanas seguidas`
                : 'Precio estable respecto al registro anterior'}
            </span>
          </div>

          <div className="contextual-item">
            <BarChart2 size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
            <span>
              {data.categoryComparisonPercent !== null
                ? data.categoryComparisonPercent < 0
                  ? `${Math.abs(data.categoryComparisonPercent)}% más barato que el promedio de su categoría esta semana`
                  : `${data.categoryComparisonPercent}% más caro que el promedio de su categoría esta semana`
                : 'En línea con el promedio de su categoría'}
            </span>
          </div>

          <div className="contextual-item">
            <Ruler size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span>
              {data.relationToMaxPercent !== null
                ? `A ${data.relationToMaxPercent}% del máximo histórico ($${(data.maxPrice || 0).toLocaleString('es-AR')})`
                : 'Sin suficientes datos de máximos'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
