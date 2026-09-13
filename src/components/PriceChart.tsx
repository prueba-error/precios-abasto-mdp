import React from 'react';
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
}

export const PriceChart: React.FC<PriceChartProps> = ({
  records,
  metric,
  productName,
  activeProductId = 0,
  activePinnedId,
  categoryName,
  pinnedProducts = [],
  pinnedHistories = {},
  chartTitleOverride
}) => {
  // Hide main average line (e.g. "Promedio Canasta") when activeProductId is 0 (all products/basket) and there are pinned products to show
  const hideMainLine = (activeProductId === 0 && pinnedProducts.length > 0);

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

  const chartData = sortedDates.map(date => {
    const item: any = { date };
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

  return (
    <div className="price-chart-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>Evolución: {headerTitle}&nbsp; — &nbsp;{metricLabel}</h3>
      <div style={{ width: '100%', height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" unit="$" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(val: any, name: string) => [val !== null ? `$${val.toLocaleString()}` : '-', name]}
            />
            {pinnedProducts.length > 0 && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
            {!hideMainLine && (
              <Line type="monotone" dataKey={productName} stroke={mainLineColor} strokeWidth={3} dot={{ r: 5 }} connectNulls />
            )}
            {activePinnedProducts.map(p => (
              <Line
                key={p.pinnedId}
                type="monotone"
                dataKey={p.productName}
                stroke={p.color}
                strokeWidth={2}
                strokeDasharray={hideMainLine ? undefined : "4 4"}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
