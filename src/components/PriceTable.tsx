import React, { useState, useEffect } from 'react';
import { PriceRecord, PriceMetric, PinnedProduct } from '../types';
import { ExtendedPriceRecord } from '../services/dataService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PriceTableProps {
  records: PriceRecord[];
  selectedMetric: PriceMetric;
  activeProductName: string;
  isAllProducts?: boolean;
  categoryProductsRecords?: ExtendedPriceRecord[];
  pinnedProducts?: PinnedProduct[];
  pinnedHistories?: { [productId: number]: PriceRecord[] };
}

interface CombinedRow extends PriceRecord {
  productName: string;
  color: string;
  changeStr: string;
  isBasketAverage?: boolean;
  isPinnedRow?: boolean;
}

export const PriceTable: React.FC<PriceTableProps> = ({
  records,
  selectedMetric,
  activeProductName,
  isAllProducts = false,
  categoryProductsRecords = [],
  pinnedProducts = [],
  pinnedHistories = {}
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Reset to page 1 whenever active selection or records change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeProductName, isAllProducts, categoryProductsRecords.length]);

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
    color: string,
    isBasketAverage = false,
    isPinnedRow = false
  ): CombinedRow[] => {
    const sorted = [...recs].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    return sorted.map((r, idx) => {
      // Only calculate variation if there is a record from a strictly earlier snapshot_date
      let prevVal: number | null = null;
      if (idx > 0 && sorted[idx - 1].snapshot_date < r.snapshot_date) {
        prevVal = sorted[idx - 1][selectedMetric];
      }
      const changeStr = calculateChange(r[selectedMetric], prevVal);
      return {
        ...r,
        productName: prodName,
        color,
        changeStr,
        isBasketAverage,
        isPinnedRow
      };
    });
  };

  // 1. Process active product records (Row 1)
  const activePinnedObj = pinnedProducts.find(p => p.productName === activeProductName);
  const activeColor = activePinnedObj ? activePinnedObj.color : '#10b981';
  const activeRows = processProductRecords(records, activeProductName, activeColor, true, false);

  // Map category individual products by product name
  const individualMap = new Map<string, ExtendedPriceRecord[]>();
  categoryProductsRecords.forEach(r => {
    const pName = r.product_name || `Producto ${r.product_id}`;
    if (!individualMap.has(pName)) {
      individualMap.set(pName, []);
    }
    individualMap.get(pName)!.push(r);
  });

  // 2. Process pinned products records (Rows 2..N, placed right below Active Product)
  const pinnedRows: CombinedRow[] = [];
  pinnedProducts.forEach(p => {
    if (p.productName !== activeProductName) {
      const list = pinnedHistories[p.productId] || individualMap.get(p.productName) || [];
      if (list.length > 0) {
        pinnedRows.push(...processProductRecords(list, p.productName, p.color, false, true));
      }
    }
  });

  // 3. Process remaining category individual products records (excluding active & pinned)
  const individualRows: CombinedRow[] = [];
  individualMap.forEach((list, pName) => {
    const isPinned = pinnedProducts.some(p => p.productName === pName);
    if (!isPinned && pName !== activeProductName) {
      individualRows.push(...processProductRecords(list, pName, '#64748b', false, false));
    }
  });

  // Sort remaining individual rows by date DESC, then product name
  individualRows.sort((a, b) => {
    const dateCmp = b.snapshot_date.localeCompare(a.snapshot_date);
    if (dateCmp !== 0) return dateCmp;
    return a.productName.localeCompare(b.productName);
  });

  // 4. Pagination logic: if isAllProducts is true, paginate remaining individual rows
  const totalItems = individualRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const displayedIndividualRows = isAllProducts
    ? individualRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : individualRows;

  // Final Row Order: [ Active Product (Row 1) ] -> [ Pinned Products (Rows 2..N) ] -> [ Remaining Individual Products ]
  const combinedRows = [...activeRows, ...pinnedRows, ...displayedIndividualRows];

  const latestDate = records.length > 0 ? records[records.length - 1].snapshot_date : '';

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tabla de Precios</span>
        {latestDate && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            — Semana del {latestDate}
          </span>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#0f172a' }}>
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
              <tr 
                key={`${r.productName}-${r.snapshot_date}-${i}`} 
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  background: r.isBasketAverage 
                    ? 'rgba(16, 185, 129, 0.08)' 
                    : r.isPinnedRow 
                    ? 'rgba(51, 65, 85, 0.3)' 
                    : 'transparent'
                }}
              >
                <td style={{ padding: '12px', fontWeight: (r.isBasketAverage || r.isPinnedRow) ? 700 : 500 }}>
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

      {isAllProducts && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0f172a', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalItems} registros)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: currentPage === 1 ? 'transparent' : 'var(--bg-card)',
                color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: currentPage === totalPages ? 'transparent' : 'var(--bg-card)',
                color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
