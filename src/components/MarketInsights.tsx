import React from 'react';
import { TrendingUp, TrendingDown, Flame, AlertTriangle, ArrowDownRight, ArrowUpRight, LineChart } from 'lucide-react';
import { MarketInsightsData } from '../utils/insightsUtils';

interface MarketInsightsProps {
  data: MarketInsightsData;
  onViewInChart?: () => void;
  onViewSectionInChart?: (section: 'subas' | 'bajas' | 'rachas') => void;
  onSelectProductItem?: (productId?: number, productName?: string) => void;
}

export const MarketInsights: React.FC<MarketInsightsProps> = ({ data, onViewInChart, onViewSectionInChart, onSelectProductItem }) => {
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
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            <div className="kpi-value-group">
              <span className="kpi-value-large" style={{ color: 'var(--text-primary)' }}>
                {data.indexedProductsCount}
              </span>
            </div>
            <span className="kpi-subtext">
              {data.newProductsCount > 0 ? `${data.newProductsCount} nuevos desde último registro` : 'Sin nuevos ingresos'}
            </span>
          </div>
        </div>

        {/* Contenedor 2 (Fondo invisible): Columna 3 (Top Subas) + Columna 4 (Top Bajas) */}
        <div className="kpi-subcontainer kpi-group-col3-4">
          <div className="kpi-card-transparent">
            <div 
              className="kpi-header-with-icon kpi-header-clickable" 
              style={{ color: 'var(--trend-up)' }}
              onClick={() => onViewSectionInChart && onViewSectionInChart('subas')}
              title="Ver Top subas en el gráfico"
            >
              <ArrowUpRight size={16} />
              <span className="kpi-label-bold">Top subas</span>
              <button 
                type="button" 
                className="kpi-header-chart-btn" 
                onClick={(e) => { e.stopPropagation(); onViewSectionInChart && onViewSectionInChart('subas'); }}
                title="Ver Top subas en el gráfico"
              >
                <LineChart size={13} />
              </button>
            </div>
            <div className="kpi-list">
              {data.topSubas.map((item, idx) => (
                <div key={item.product_id || idx} className="kpi-list-item">
                  <span className="kpi-item-name">
                    <span className="kpi-item-index">{idx + 1}.</span>
                    <span 
                      className="kpi-item-link"
                      onClick={() => onSelectProductItem && onSelectProductItem(item.product_id, item.product_name)}
                      title={`Ver producto ${item.product_name}`}
                    >
                      {item.product_name}
                    </span>
                  </span>
                  <span className="kpi-item-badge-danger">+{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kpi-card-transparent">
            <div 
              className="kpi-header-with-icon kpi-header-clickable" 
              style={{ color: 'var(--trend-down)' }}
              onClick={() => onViewSectionInChart && onViewSectionInChart('bajas')}
              title="Ver Top bajas en el gráfico"
            >
              <ArrowDownRight size={16} />
              <span className="kpi-label-bold">Top bajas</span>
              <button 
                type="button" 
                className="kpi-header-chart-btn" 
                onClick={(e) => { e.stopPropagation(); onViewSectionInChart && onViewSectionInChart('bajas'); }}
                title="Ver Top bajas en el gráfico"
              >
                <LineChart size={13} />
              </button>
            </div>
            <div className="kpi-list">
              {data.topBajas.map((item, idx) => (
                <div key={item.product_id || idx} className="kpi-list-item">
                  <span className="kpi-item-name">
                    <span className="kpi-item-index">{idx + 1}.</span>
                    <span 
                      className="kpi-item-link"
                      onClick={() => onSelectProductItem && onSelectProductItem(item.product_id, item.product_name)}
                      title={`Ver producto ${item.product_name}`}
                    >
                      {item.product_name}
                    </span>
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
            <div 
              className="kpi-header-with-icon kpi-header-clickable" 
              style={{ color: '#fb923c' }}
              onClick={() => onViewSectionInChart && onViewSectionInChart('rachas')}
              title="Ver Rachas activas en el gráfico"
            >
              <Flame size={16} />
              <span className="kpi-label-bold">Rachas activas</span>
              <button 
                type="button" 
                className="kpi-header-chart-btn" 
                onClick={(e) => { e.stopPropagation(); onViewSectionInChart && onViewSectionInChart('rachas'); }}
                title="Ver Rachas activas en el gráfico"
              >
                <LineChart size={13} />
              </button>
            </div>
            <div className="kpi-list">
              {data.rachasActivas.map((item, idx) => (
                <div key={item.product_id || idx} className="kpi-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="kpi-item-name">
                      <span 
                        className="kpi-item-link"
                        onClick={() => onSelectProductItem && onSelectProductItem(item.product_id, item.product_name)}
                        title={`Ver producto ${item.product_name}`}
                      >
                        {item.product_name}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: item.type === 'up' ? 'var(--trend-up)' : 'var(--trend-down)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span>x{item.weeks}{item.cumPercent !== undefined ? ` (${item.cumPercent}%)` : ''}</span>
                      {item.type === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* 2. Cintas de Estado y Alertas (Status Banners Stack - Comentados temporalmente) */}
      {/* 
      <div className="banners-stack">
        <div className="status-banner banner-green">
          <p className="banner-inline-paragraph">
            <TrendingDown size={15} className="banner-icon-green banner-inline-icon" />
            <strong className="banner-title">Productos cerca de su mínimo: </strong>
            <span className="banner-inline-content">{nearMinText}</span>
          </p>
        </div>

        <div className="status-banner banner-red">
          <p className="banner-inline-paragraph">
            <TrendingUp size={15} className="banner-icon-red banner-inline-icon" />
            <strong className="banner-title">Productos cerca de su máximo: </strong>
            <span className="banner-inline-content">{nearMaxText}</span>
          </p>
        </div>

        <div className="status-banner banner-amber">
          <p className="banner-inline-paragraph">
            <AlertTriangle size={15} className="banner-icon-amber banner-inline-icon" />
            <strong className="banner-title">Precios atípicos: </strong>
            <span className="banner-inline-content">{atypicalText}</span>
          </p>
        </div>
      </div>
      */}
    </section>

    {/* 3. Enlace inferior: Ver en el gráfico (Comentado temporalmente) */}
    {/* 
    <div className="market-insights-footer">
      <button className="view-in-chart-link" onClick={onViewInChart}>
        <LineChart size={14} />
        <span>Ver en el gráfico</span>
      </button>
    </div>
    */}
  </div>
);
};
