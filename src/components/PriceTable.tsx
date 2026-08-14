import React from 'react';
import { PriceRecord, PriceMetric } from '../types';

interface PriceTableProps {
  records: PriceRecord[];
  selectedMetric: PriceMetric;
}

export const PriceTable: React.FC<PriceTableProps> = ({ records, selectedMetric }) => {
  const calculateChange = (current: number | null, prev: number | null): string => {
    if (current === null || prev === null || prev <= 0) return 'N/A';
    const diff = ((current - prev) / prev) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#0f172a' }}>
            <th style={{ padding: '12px' }}>Fecha</th>
            <th style={{ padding: '12px' }}>Desde</th>
            <th style={{ padding: '12px' }}>Hasta</th>
            <th style={{ padding: '12px' }}>Promedio</th>
            <th style={{ padding: '12px' }}>Variación Semanal</th>
            <th style={{ padding: '12px' }}>Origen</th>
            <th style={{ padding: '12px' }}>Presentación</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const prevVal = i > 0 ? records[i - 1][selectedMetric] : null;
            const changeStr = calculateChange(r[selectedMetric], prevVal);
            const isPos = changeStr.startsWith('+');
            const isNeg = changeStr.startsWith('-');
            const changeColor = isPos ? '#ef4444' : isNeg ? '#10b981' : 'var(--text-secondary)';

            return (
              <tr key={r.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>{r.snapshot_date}</td>
                <td style={{ padding: '12px' }}>{r.price_from ? `$${r.price_from.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px' }}>{r.price_to ? `$${r.price_to.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#10b981' }}>{r.price_avg ? `$${r.price_avg.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: changeColor }}>{changeStr}</td>
                <td style={{ padding: '12px' }}>{r.origin || '-'}</td>
                <td style={{ padding: '12px' }}>{r.presentation || '-'} ({r.quantity_raw || ''})</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
