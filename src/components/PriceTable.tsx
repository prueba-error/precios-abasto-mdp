import React from 'react';
import { PriceRecord, PriceMetric, PinnedProduct } from '../types';

interface PriceTableProps {
  records: PriceRecord[];
  selectedMetric: PriceMetric;
  activeProductName: string;
  pinnedProducts?: PinnedProduct[];
  pinnedHistories?: { [productId: number]: PriceRecord[] };
}

interface CombinedRow extends PriceRecord {
  productName: string;
  color: string;
  changeStr: string;
}

export const PriceTable: React.FC<PriceTableProps> = ({
  records,
  selectedMetric,
  activeProductName,
  pinnedProducts = [],
  pinnedHistories = {}
}) => {
  const calculateChange = (current: number | null, prev: number | null): string => {
    if (current === null || prev === null || prev <= 0) return 'N/A';
    const diff = ((current - prev) / prev) * 100;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  };

  const formatPresentation = (pres: string | null, qty: string | null): string => {
    const p = pres && pres !== '-' ? pres.trim() : null;
    const q = qty && qty !== '-' ? qty.trim() : null;

    if (p && q) return `${p} (${q})`;
    if (p) return p;
    if (q) return q;
    return '-';
  };

  // Helper to process records per product and compute correct week-over-week changes
  const processProductRecords = (
    recs: PriceRecord[],
    prodName: string,
    color: string
  ): CombinedRow[] => {
    const sorted = [...recs].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    return sorted.map((r, idx) => {
      const prevVal = idx > 0 ? sorted[idx - 1][selectedMetric] : null;
      const changeStr = calculateChange(r[selectedMetric], prevVal);
      return {
        ...r,
        productName: prodName,
        color,
        changeStr
      };
    });
  };

  // 1. Process active product records (use pinned color if active product is currently pinned)
  const activePinnedObj = pinnedProducts.find(p => p.productName === activeProductName);
  const activeColor = activePinnedObj ? activePinnedObj.color : '#10b981';
  const activeRows = processProductRecords(records, activeProductName, activeColor);

  // 2. Process pinned products records (excluding active product to avoid duplicate rows)
  const pinnedRows: CombinedRow[] = [];
  pinnedProducts.forEach(p => {
    if (p.productName !== activeProductName) {
      const list = pinnedHistories[p.productId] || [];
      pinnedRows.push(...processProductRecords(list, p.productName, p.color));
    }
  });

  // 3. Combine and sort by date DESC, then product name
  const combinedRows = [...activeRows, ...pinnedRows].sort((a, b) => {
    const dateCmp = b.snapshot_date.localeCompare(a.snapshot_date);
    if (dateCmp !== 0) return dateCmp;
    return a.productName.localeCompare(b.productName);
  });

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#0f172a' }}>
            <th style={{ padding: '12px' }}>Fecha</th>
            <th style={{ padding: '12px' }}>Producto</th>
            <th style={{ padding: '12px' }}>Desde</th>
            <th style={{ padding: '12px' }}>Hasta</th>
            <th style={{ padding: '12px' }}>Promedio</th>
            <th style={{ padding: '12px' }}>Variación Semanal</th>
            <th style={{ padding: '12px' }}>Origen</th>
            <th style={{ padding: '12px' }}>Presentación</th>
          </tr>
        </thead>
        <tbody>
          {combinedRows.map((r, i) => {
            const isPos = r.changeStr.startsWith('+');
            const isNeg = r.changeStr.startsWith('-');
            const changeColor = isPos ? '#ef4444' : isNeg ? '#10b981' : 'var(--text-secondary)';

            return (
              <tr key={`${r.productName}-${r.snapshot_date}-${i}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>{r.snapshot_date}</td>
                <td style={{ padding: '12px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color, flexShrink: 0 }}></span>
                    <span>{r.productName}</span>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{r.price_from ? `$${r.price_from.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px' }}>{r.price_to ? `$${r.price_to.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#10b981' }}>{r.price_avg ? `$${r.price_avg.toLocaleString()}` : '-'}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: changeColor }}>{r.changeStr}</td>
                <td style={{ padding: '12px' }}>{r.origin || '-'}</td>
                <td style={{ padding: '12px' }}>{formatPresentation(r.presentation, r.quantity_raw)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
