import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { PriceRecord, PriceMetric, PinnedProduct } from '../types';

interface PriceChartProps {
  records: PriceRecord[];
  metric: PriceMetric;
  productName: string;
  activeProductId?: number;
  activePinnedId?: string;
  categoryName?: string;
  pinnedProducts?: PinnedProduct[];
  pinnedHistories?: { [pinnedId: string]: PriceRecord[] };
  chartTitleOverride?: string | null;
  hoveredSeries?: string | null;
  onHoverSeries?: (seriesName: string | null) => void;
  onSelectProductItem?: (productId?: number, productName?: string) => void;
}

interface SingleSeriesTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  hoveredSeries?: string | null;
}

const SingleSeriesTooltip: React.FC<SingleSeriesTooltipProps> = ({ active, payload, label, hoveredSeries }) => {
  if (!active || !payload || !payload.length || !hoveredSeries) return null;

  const validPayload = payload.filter((item: any) => item.value !== null && item.value !== undefined && typeof item.value === 'number');
  if (!validPayload.length) return null;

  const targetItem = validPayload.find((item: any) => item.name === hoveredSeries || item.dataKey === hoveredSeries);
  if (!targetItem) return null;

  const formattedLabel = typeof label === 'number'
    ? (() => {
        const d = new Date(label);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      })()
    : label;

  return (
    <div 
      style={{
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '6px',
        padding: '8px 12px',
        color: '#f8fafc',
        fontSize: '0.8125rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'none'
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>{formattedLabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: targetItem.color, display: 'inline-block' }} />
        <span>{targetItem.name}:</span>
        <span style={{ color: '#38bdf8' }}>${Number(targetItem.value).toLocaleString('es-AR')}</span>
      </div>
    </div>
  );
};

export const PriceChart: React.FC<PriceChartProps> = ({
  records,
  metric,
  productName,
  activeProductId = 0,
  activePinnedId,
  categoryName,
  pinnedProducts = [],
  pinnedHistories = {},
  chartTitleOverride,
  hoveredSeries: hoveredSeriesProp,
  onHoverSeries,
  onSelectProductItem
}) => {
  const [internalHoveredSeries, setInternalHoveredSeries] = useState<string | null>(null);

  const hoveredSeries = hoveredSeriesProp !== undefined ? hoveredSeriesProp : internalHoveredSeries;

  const setHoveredSeries = (name: string | null) => {
    if (onHoverSeries) {
      onHoverSeries(name);
    }
    setInternalHoveredSeries(name);
  };

  // Hide main average line (e.g. "Promedio Canasta") when activeProductId is 0 or -1 (all products/basket/list view) and there are pinned products to show
  const hideMainLine = (activeProductId <= 0 && pinnedProducts.length > 0);

  const activePinnedProducts = hideMainLine
    ? pinnedProducts
    : pinnedProducts.filter(p => p.pinnedId !== activePinnedId);

  const hasOtherPinned = activePinnedProducts.length > 0;
  const titleOthers = hasOtherPinned ? ', Otros' : '';
  const metricLabel = metric === 'price_avg' ? 'Precio Promedio' : metric === 'price_from' ? 'Precio Desde' : 'Precio Hasta';
  const titlePrefix = categoryName ? `${categoryName} / ` : '';

  const mainPinnedObj = pinnedProducts.find(
    p => p.pinnedId === activePinnedId
  );
  const mainLineColor = mainPinnedObj ? mainPinnedObj.color : '#10b981';

  // Merge all dates across active product & pinned products
  const datesSet = new Set<string>();
  if (!hideMainLine) {
    records.forEach(r => datesSet.add(r.snapshot_date));
  }
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.pinnedId] || [];
    list.forEach(r => datesSet.add(r.snapshot_date));
  });

  const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

  const activeMap = new Map(records.map(r => [r.snapshot_date, r[metric]]));
  
  const pinnedMaps = new Map<string, Map<string, number | null>>();
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.pinnedId] || [];
    pinnedMaps.set(p.pinnedId, new Map(list.map(r => [r.snapshot_date, r[metric]])));
  });

  const parseDateToTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const sortedTimestamps = sortedDates.map(parseDateToTimestamp);

  const chartData = sortedDates.map(date => {
    const ts = parseDateToTimestamp(date);
    const item: any = { date, timestamp: ts };
    if (!hideMainLine) {
      item[productName] = activeMap.get(date) ?? null;
    }
    activePinnedProducts.forEach(p => {
      const pMap = pinnedMaps.get(p.pinnedId);
      item[p.productName] = pMap?.get(date) ?? null;
    });
    return item;
  });

  const headerTitle = chartTitleOverride
    ? chartTitleOverride
    : (hideMainLine ? 'Comparativa de Productos' : `${titlePrefix}${productName}${titleOthers}`);

  const getColorForSeries = (seriesName: string, entryColor?: string) => {
    if (entryColor && entryColor !== 'rgba(0,0,0,0)' && entryColor !== 'transparent') {
      return entryColor;
    }
    if (seriesName === productName) return mainLineColor;
    const found = pinnedProducts.find(p => p.productName === seriesName);
    return found ? found.color : '#38bdf8';
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;

    // Filter out transparent hover target entries and duplicates by product name
    const validEntries = payload.filter((entry: any) =>
      entry.color && entry.color !== 'rgba(0,0,0,0)' && entry.color !== 'transparent'
    );
    const targetPayload = validEntries.length > 0 ? validEntries : payload;

    const uniquePayload = targetPayload.filter((entry: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t.value === entry.value)
    );

    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px 16px',
        paddingTop: '16px'
      }}>
        {uniquePayload.map((entry: any, index: number) => {
          const isHovered = hoveredSeries === entry.value;
          const itemColor = getColorForSeries(entry.value, entry.color);
          return (
            <div
              key={`legend-item-${index}`}
              onMouseOver={() => setHoveredSeries(entry.value)}
              onMouseOut={() => setHoveredSeries(null)}
              onClick={() => onSelectProductItem?.(undefined, entry.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: hoveredSeries ? (isHovered ? 1 : 0.4) : 1,
                transition: 'all 0.15s ease',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: isHovered ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: itemColor,
                  display: 'inline-block',
                  flexShrink: 0
                }}
              />
              <span style={{ color: isHovered ? '#ffffff' : '#cbd5e1', fontSize: '0.8125rem', fontWeight: isHovered ? 600 : 500 }}>
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="price-chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>Evolución: {headerTitle}&nbsp;</h3>
      <div style={{ width: '100%', height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} onMouseLeave={() => setHoveredSeries(null)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={sortedTimestamps}
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }} 
              tickMargin={8} 
              tickFormatter={(ts: number) => {
                const d = new Date(ts);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              }}
            />
            <YAxis stroke="#94a3b8" unit="$" tick={{ fontSize: 11 }} tickMargin={8} />
            <Tooltip content={<SingleSeriesTooltip hoveredSeries={hoveredSeries} />} isAnimationActive={false} />
            {/* Legend with product names and colors below chart hidden */}
            {!hideMainLine && (
              <>
                {/* Invisible wide line target for mouse hover tolerance */}
                <Line
                  type="monotone"
                  dataKey={productName}
                  stroke="rgba(0,0,0,0)"
                  strokeWidth={14}
                  legendType="none"
                  dot={false}
                  activeDot={false}
                  connectNulls
                  onMouseOver={() => setHoveredSeries(productName)}
                  onMouseOut={() => setHoveredSeries(null)}
                  onClick={() => onSelectProductItem?.(activeProductId, productName)}
                  style={{ cursor: 'pointer' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={productName} 
                  stroke={mainLineColor} 
                  strokeWidth={hoveredSeries === productName ? 4 : 3}
                  strokeOpacity={hoveredSeries ? (hoveredSeries === productName ? 1 : 0.35) : 1}
                  dot={{ r: 4 }} 
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2, 
                    stroke: '#ffffff',
                    onMouseOver: () => setHoveredSeries(productName),
                    onMouseOut: () => setHoveredSeries(null),
                    onClick: () => onSelectProductItem?.(activeProductId, productName)
                  }}
                  connectNulls 
                  onMouseOver={() => setHoveredSeries(productName)}
                  onMouseOut={() => setHoveredSeries(null)}
                  onClick={() => onSelectProductItem?.(activeProductId, productName)}
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease, stroke-opacity 0.15s ease' }}
                />
              </>
            )}
            {activePinnedProducts.map(p => {
              const isHovered = hoveredSeries === p.productName;
              return (
                <React.Fragment key={p.pinnedId}>
                  {/* Invisible wide line target for mouse hover tolerance */}
                  <Line
                    type="monotone"
                    dataKey={p.productName}
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={14}
                    legendType="none"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    onMouseOver={() => setHoveredSeries(p.productName)}
                    onMouseOut={() => setHoveredSeries(null)}
                    onClick={() => onSelectProductItem?.(p.productId, p.productName)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={p.productName}
                    stroke={p.color}
                    strokeWidth={isHovered ? 3.5 : 2}
                    strokeOpacity={hoveredSeries ? (isHovered ? 1 : 0.35) : 1}
                    strokeDasharray={hideMainLine ? undefined : "4 4"}
                    dot={{ r: 3.5 }}
                    activeDot={{ 
                      r: 5.5, 
                      strokeWidth: 2, 
                      stroke: '#ffffff',
                      onMouseOver: () => setHoveredSeries(p.productName),
                      onMouseOut: () => setHoveredSeries(null),
                      onClick: () => onSelectProductItem?.(p.productId, p.productName)
                    }}
                    connectNulls
                    onMouseOver={() => setHoveredSeries(p.productName)}
                    onMouseOut={() => setHoveredSeries(null)}
                    onClick={() => onSelectProductItem?.(p.productId, p.productName)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease, stroke-opacity 0.15s ease' }}
                  />
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
