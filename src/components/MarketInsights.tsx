import React from 'react';
import { TrendingUp, TrendingDown, Flame, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MarketInsightsData } from '../utils/insightsUtils';

interface MarketInsightsProps {
  data: MarketInsightsData;
}

export const MarketInsights: React.FC<MarketInsightsProps> = ({ data }) => {
  const isIndexPositive = data.indexChangePercent >= 0;

  return (
    <section style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Fila de Métricas Generales (Header KPI Grid) */}
      <div className="kpi-grid-container">
        {/* Columna 1: Índice Principal */}
        <div className="kpi-card">
          <span className="kpi-label">Índice Abasto</span>
          <div className="kpi-value-group">
            <span style={{ color: isIndexPositive ? '#ef4444' : '#10b981' }} className="kpi-value-large">
              {isIndexPositive ? `+${data.indexChangePercent}%` : `${data.indexChangePercent}%`}
            </span>
          </div>
          <span className="kpi-subtext">desde último registro</span>
        </div>

        {/* Columna 2: Volumen */}
        <div className="kpi-card">
          <span className="kpi-label">Productos Indexados</span>
          <span className="kpi-value-large" style={{ color: 'var(--text-primary)' }}>
            {data.indexedProductsCount}
          </span>
          <span className="kpi-subtext">
            {data.newProductsCount > 0 ? `${data.newProductsCount} nuevos desde último registro` : 'Sin nuevos ingresos'}
          </span>
        </div>

        {/* Columna 3: Top Subas */}
        <div className="kpi-card">
          <div className="kpi-header-with-icon" style={{ color: '#f87171' }}>
            <ArrowUpRight size={16} />
            <span className="kpi-label-bold">Top subas</span>
          </div>
          <div className="kpi-list">
            {data.topSubas.map((item, idx) => (
              <div key={item.product_id || idx} className="kpi-list-item">
                <span className="kpi-item-name">
                  <span className="kpi-item-index">{idx + 1}.</span> {item.product_name}
                </span>
                <span className="kpi-item-badge-danger">+{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 4: Top Bajas */}
        <div className="kpi-card">
          <div className="kpi-header-with-icon" style={{ color: '#34d399' }}>
            <ArrowDownRight size={16} />
            <span className="kpi-label-bold">Top bajas</span>
          </div>
          <div className="kpi-list">
            {data.topBajas.map((item, idx) => (
              <div key={item.product_id || idx} className="kpi-list-item">
                <span className="kpi-item-name">
                  <span className="kpi-item-index">{idx + 1}.</span> {item.product_name}
                </span>
                <span className="kpi-item-badge-success">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 5: Rachas Activas */}
        <div className="kpi-card">
          <div className="kpi-header-with-icon" style={{ color: '#fb923c' }}>
            <Flame size={16} />
            <span className="kpi-label-bold">Rachas activas</span>
          </div>
          <div className="kpi-list">
            {data.rachasActivas.map((item, idx) => (
              <div key={item.product_id || idx} className="kpi-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="kpi-item-name">{item.product_name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.type === 'up' ? '#f87171' : '#34d399' }}>
                    {item.type === 'up' ? `subiendo x${item.weeks} sem` : `bajando x${item.weeks} sem`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cintas de Estado y Alertas (Status Banners Stack) */}
      <div className="banners-stack">
        {/* Banner 1: Mínimos Promedio (Verde / Piso) */}
        <div className="status-banner banner-green">
          <div className="banner-header">
            <TrendingDown size={17} className="banner-icon-green" />
            <span className="banner-title">Productos Cerca de su Mínimo Promedio Histórico</span>
          </div>
          <div className="banner-body">
            {data.nearMinProducts.map((p, idx) => (
              <span key={idx} className="banner-tag">
                {p.product_name} ({p.percent_from_bound}% del mín.{p.price ? ` - $${p.price.toLocaleString('es-AR')}` : ''})
                {idx < data.nearMinProducts.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Banner 2: Máximos Promedio (Rojo / Pico) */}
        <div className="status-banner banner-red">
          <div className="banner-header">
            <TrendingUp size={17} className="banner-icon-red" />
            <span className="banner-title">Productos Cerca de su Máximo Promedio Histórico</span>
          </div>
          <div className="banner-body">
            {data.nearMaxProducts.map((p, idx) => (
              <span key={idx} className="banner-tag">
                {p.product_name} ({p.percent_from_bound}% del máx.)
                {idx < data.nearMaxProducts.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Banner 3: Alerta de Anomalías (Amarillo / Ámbar) */}
        <div className="status-banner banner-amber">
          <div className="banner-header">
            <AlertTriangle size={17} className="banner-icon-amber" />
            <span className="banner-title">Precios atípicos</span>
          </div>
          <div className="banner-body">
            {data.atypicalProducts.map((p, idx) => (
              <span key={idx} className="banner-tag">
                <strong style={{ color: 'var(--text-primary)' }}>{p.product_name}:</strong> {p.text}
                {idx < data.atypicalProducts.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
