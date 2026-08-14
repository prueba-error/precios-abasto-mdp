import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PriceRecord, PriceMetric } from '../types';

interface PriceChartProps {
  records: PriceRecord[];
  metric: PriceMetric;
  productName: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ records, metric, productName }) => {
  const metricLabel = metric === 'price_avg' ? 'Promedio' : metric === 'price_from' ? 'Mínimo' : 'Máximo';

  const chartData = records.map(r => ({
    date: r.snapshot_date,
    precio: r[metric]
  }));

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>Evolución: {productName} ({metricLabel})</h3>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" unit="$" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(val: number) => [`$${val?.toLocaleString()}`, metricLabel]}
            />
            <Line type="monotone" dataKey="precio" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
