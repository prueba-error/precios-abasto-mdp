import React from 'react';
import { TrendingUp, TrendingDown, Flame, AlertTriangle, ArrowDownRight, ArrowUpRight, LineChart } from 'lucide-react';
import { MarketInsightsData } from '../utils/insightsUtils';

interface MarketInsightsProps {
  data: MarketInsightsData;
  onViewInChart?: () => void;
}

export const MarketInsights: React.FC<MarketInsightsProps> = ({ data, onViewInChart }) => {
  const isIndexPositive = data.indexChangePercent >= 0;

  const nearMinText = data.nearMinProducts
    .slice(0, 10)
    .map(p => `${p.product_name} (${p.percent_from_bound}% del mín.${p.price ? ` - $${p.price.toLocaleString('es-AR')}` : ''})`)
    .join('; ');

  const nearMaxText = data.nearMaxProducts
    .slice(0, 10)
    .map(p => `${p.product_name} (${p.percent_from_bound}% del máx.)`)
    .join('; ');

  const atypicalText = data.atypicalProducts
    .slice(0, 10)
    .map(p => `${p.product_name}: ${p.text}`)
    .join('; ');

  return (
    <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <section className="market-insights-card">
      {/* 1. Fila de Métricas Generales (Header KPI Grid) */}
      <div className="kpi-grid-container">
        {/* Contenedor 1 (Fondo invisible): Columna 1 (Índice) + Columna 2 (Volumen) */}
        <div className="kpi-subcontainer kpi-group-col1-2">
          <div className="kpi-card-transparent">
            <span className="kpi-label">Índice Abasto</span>
            <div className="kpi-value-group">
              <span style={{ color: isIndexPositive ? '#ef4444' : '#10b981' }} className="kpi-value-large">
                {isIndexPositive ? `+${data.indexChangePercent}%` : `${data.indexChangePercent}%`}
              </span>
            </div>
            <span className="kpi-subtext">desde último registro</span>
          </div>

          <div className="kpi-card-transparent">
            <span className="kpi-label">Productos Indexados</span>
            <span className="kpi-value-large" style={{ color: 'var(--text-primary)' }}>
              {data.indexedProductsCount}
            </span>
            <span className="kpi-subtext">
              {data.newProductsCount > 0 ? `${data.newProductsCount} nuevos desde último registro` : 'Sin nuevos ingresos'}
            </span>
          </div>
        </div>

        {/* Contenedor 2 (Fondo invisible): Columna 3 (Top Subas) + Columna 4 (Top Bajas) */}
        <div className="kpi-subcontainer kpi-group-col3-4">
          <div className="kpi-card-transparent">
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

          <div className="kpi-card-transparent">
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
        </div>

        {/* Contenedor 3 (Fondo invisible independiente): Columna 5 (Rachas Activas) */}
        <div className="kpi-subcontainer kpi-group-col5">
          <div className="kpi-card-transparent">
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
      </div>

      {/* 2. Cintas de Estado y Alertas (Status Banners Stack - Single Line with Semicolon) */}
      <div className="banners-stack">
        {/* Banner 1: Mínimos Promedio */}
        <div className="status-banner banner-green banner-inline-row">
          <div className="banner-inline-header">
            <TrendingDown size={15} className="banner-icon-green" style={{ flexShrink: 0 }} />
            <strong className="banner-title">Productos Cerca de su Mínimo Promedio Histórico:</strong>
          </div>
          <span className="banner-inline-content">{nearMinText}</span>
        </div>

        {/* Banner 2: Máximos Promedio */}
        <div className="status-banner banner-red banner-inline-row">
          <div className="banner-inline-header">
            <TrendingUp size={15} className="banner-icon-red" style={{ flexShrink: 0 }} />
            <strong className="banner-title">Productos Cerca de su Máximo Promedio Histórico:</strong>
          </div>
          <span className="banner-inline-content">{nearMaxText}</span>
        </div>

        {/* Banner 3: Alerta de Anomalías */}
        <div className="status-banner banner-amber banner-inline-row">
          <div className="banner-inline-header">
            <AlertTriangle size={15} className="banner-icon-amber" style={{ flexShrink: 0 }} />
            <strong className="banner-title">Precios atípicos:</strong>
          </div>
          <span className="banner-inline-content">{atypicalText}</span>
        </div>
      </div>
    </section>

    {/* 3. Enlace inferior: Ver en el gráfico (A continuación del contenedor) */}
    <div className="market-insights-footer">
      <button className="view-in-chart-link" onClick={onViewInChart}>
        <LineChart size={14} />
        <span>Ver en el gráfico</span>
      </button>
    </div>
  </div>
);
};
