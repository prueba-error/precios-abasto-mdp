import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { PriceRecord, PriceMetric, PinnedProduct } from '../types';

interface PriceChartProps {
  records: PriceRecord[];
  metric: PriceMetric;
  productName: string;
  activeProductId?: number;
  categoryName?: string;
  pinnedProducts?: PinnedProduct[];
  pinnedHistories?: { [productId: number]: PriceRecord[] };
}

export const PriceChart: React.FC<PriceChartProps> = ({
  records,
  metric,
  productName,
  activeProductId,
  categoryName,
  pinnedProducts = [],
  pinnedHistories = {}
}) => {
  const metricLabel = metric === 'price_avg' ? 'Promedio' : metric === 'price_from' ? 'Mínimo' : 'Máximo';
  const titlePrefix = categoryName ? `${categoryName} / ` : '';

  // Check if active product is pinned to match its assigned system color instead of green
  const mainPinnedObj = pinnedProducts.find(
    p => p.productId === activeProductId || p.productName === productName
  );
  const mainLineColor = mainPinnedObj ? mainPinnedObj.color : '#10b981';

  // Exclude the active product from the pinned lines list to prevent rendering duplicate lines on the chart
  const activePinnedProducts = pinnedProducts.filter(
    p => p.productId !== activeProductId && p.productName !== productName
  );

  // Merge all dates across active product & pinned products
  const datesSet = new Set<string>();
  records.forEach(r => datesSet.add(r.snapshot_date));
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.productId] || [];
    list.forEach(r => datesSet.add(r.snapshot_date));
  });

  const sortedDates = Array.from(datesSet).sort((a, b) => a.localeCompare(b));

  const activeMap = new Map(records.map(r => [r.snapshot_date, r[metric]]));
  
  const pinnedMaps = new Map<number, Map<string, number | null>>();
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.productId] || [];
    pinnedMaps.set(p.productId, new Map(list.map(r => [r.snapshot_date, r[metric]])));
  });

  const chartData = sortedDates.map(date => {
    const item: any = { date, [productName]: activeMap.get(date) ?? null };
    activePinnedProducts.forEach(p => {
      const pMap = pinnedMaps.get(p.productId);
      item[p.productName] = pMap?.get(date) ?? null;
    });
    return item;
  });

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>Evolución: {titlePrefix}{productName}&nbsp; — &nbsp;{metricLabel}</h3>
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
            <Line type="monotone" dataKey={productName} stroke={mainLineColor} strokeWidth={3} dot={{ r: 5 }} connectNulls />
            {activePinnedProducts.map(p => (
              <Line
                key={p.productId}
                type="monotone"
                dataKey={p.productName}
                stroke={p.color}
                strokeWidth={2}
                strokeDasharray="4 4"
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
