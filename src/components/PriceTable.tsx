import React, { useState, useEffect } from 'react';
import { PriceRecord, PriceMetric, PinnedProduct } from '../types';
import { ExtendedPriceRecord } from '../services/dataService';
import { ChevronLeft, ChevronRight, Table, Calendar, Database, Pin } from 'lucide-react';

interface PriceTableProps {
  records: PriceRecord[];
  selectedMetric: PriceMetric;
  activeProductName: string;
  activePinnedId?: string;
  selectedCategory?: number;
  selectedProduct?: number;
  isAllProducts?: boolean;
  categoryProductsRecords?: ExtendedPriceRecord[];
  pinnedProducts?: PinnedProduct[];
  pinnedHistories?: { [pinnedId: string]: PriceRecord[] };
  isMock?: boolean;
  lastUpdated?: string;
  onTogglePinItem?: (productId: number, categoryId: number, productName: string) => void;
  onSelectProductItem?: (productId: number, categoryId: number) => void;
}

interface CombinedRow extends PriceRecord {
  productName: string;
  categoryId: number;
  productId: number;
  pinnedId: string;
  color: string;
  changeStr: string;
  isBasketAverage?: boolean;
  isPinnedRow?: boolean;
}

export const PriceTable: React.FC<PriceTableProps> = ({
  records,
  selectedMetric,
  activeProductName,
  activePinnedId,
  selectedCategory = 0,
  selectedProduct = 0,
  isAllProducts = false,
  categoryProductsRecords = [],
  pinnedProducts = [],
  pinnedHistories = {},
  isMock = false,
  lastUpdated,
  onTogglePinItem,
  onSelectProductItem
}) => {
  const [viewMode, setViewMode] = useState<'detailed' | 'historical'>('detailed');
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
    isPinnedRow = false,
    forcedProdId?: number,
    forcedCatId?: number
  ): CombinedRow[] => {
    const sorted = [...recs].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    return sorted.map((r, idx) => {
      let prevVal: number | null = null;
      if (idx > 0 && sorted[idx - 1].snapshot_date < r.snapshot_date) {
        prevVal = sorted[idx - 1][selectedMetric];
      }
      const changeStr = calculateChange(r[selectedMetric], prevVal);
      const prodId = forcedProdId !== undefined ? forcedProdId : r.product_id;
      const catId = forcedCatId !== undefined ? forcedCatId : ((r as any).category_id ?? selectedCategory);
      return {
        ...r,
        productId: prodId,
        categoryId: catId,
        pinnedId: `cat_${catId}_prod_${prodId}`,
        productName: prodName,
        color,
        changeStr,
        isBasketAverage,
        isPinnedRow
      };
    });
  };

  const latestDate = records.length > 0 ? records[records.length - 1].snapshot_date : '';

  // 1. Process active product records (Row 1: Latest snapshot)
  const activePinnedObj = pinnedProducts.find(p => p.pinnedId === activePinnedId);
  const activeColor = activePinnedObj ? activePinnedObj.color : '#10b981';
  const allActiveRows = processProductRecords(records, activeProductName, activeColor, true, false, selectedProduct, selectedCategory);
  const activeRows = allActiveRows.length > 0 ? [allActiveRows[allActiveRows.length - 1]] : [];

  // Map category individual products by product name
  const individualMap = new Map<string, ExtendedPriceRecord[]>();
  categoryProductsRecords.forEach(r => {
    const pName = r.product_name || `Producto ${r.product_id}`;
    if (!individualMap.has(pName)) {
      individualMap.set(pName, []);
    }
    individualMap.get(pName)!.push(r);
  });

  // 2. Process pinned products records (Rows 2..N, placed right below Active Product: Latest snapshot per pinned item)
  const pinnedRows: CombinedRow[] = [];
  pinnedProducts.forEach(p => {
    if (p.pinnedId !== activePinnedId) {
      const list = pinnedHistories[p.pinnedId] || individualMap.get(p.productName) || [];
      if (list.length > 0) {
        const processed = processProductRecords(list, p.productName, p.color, false, true, p.productId, p.categoryId);
        if (processed.length > 0) {
          const latestPinnedRow = (latestDate ? processed.find(r => r.snapshot_date === latestDate) : null) || processed[processed.length - 1];
          pinnedRows.push(latestPinnedRow);
        }
      }
    }
  });

  // 3. Process remaining category individual products records (excluding active & pinned)
  const individualRows: CombinedRow[] = [];
  individualMap.forEach((list, pName) => {
    const isPinned = pinnedProducts.some(p => p.productName === pName);
    if (!isPinned && pName !== activeProductName) {
      const firstRec = list[0];
      const pId = firstRec.product_id;
      const cId = (firstRec as any).category_id ?? selectedCategory;
      individualRows.push(...processProductRecords(list, pName, '#64748b', false, false, pId, cId));
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

  // Final Row Order for Detailed View: [ Active Product (Row 1) ] -> [ Pinned Products ] -> [ Remaining Individual Products ]
  const combinedRows = [...activeRows, ...pinnedRows, ...displayedIndividualRows];

  // Prepare Historical View Data (Columns: [Fecha | ActiveProduct | PinnedProduct1 | PinnedProduct2...])
  const activePinnedProducts = pinnedProducts.filter(p => p.pinnedId !== activePinnedId);
  
  const historicalDatesSet = new Set<string>();
  records.forEach(r => historicalDatesSet.add(r.snapshot_date));
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.pinnedId] || [];
    list.forEach(r => historicalDatesSet.add(r.snapshot_date));
  });

  const sortedHistoricalDates = Array.from(historicalDatesSet).sort((a, b) => b.localeCompare(a)); // DESC

  const activeDateValueMap = new Map(records.map(r => [r.snapshot_date, r[selectedMetric]]));
  
  const pinnedDateValueMaps = new Map<string, Map<string, number | null>>();
  activePinnedProducts.forEach(p => {
    const list = pinnedHistories[p.pinnedId] || [];
    pinnedDateValueMaps.set(p.pinnedId, new Map(list.map(r => [r.snapshot_date, r[selectedMetric]])));
  });

  return (
    <div style={{ marginBottom: '0px' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tabla de Precios</span>
          {latestDate && viewMode === 'detailed' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              — Semana del {latestDate}
            </span>
          )}
        </div>

        {/* View Mode Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('detailed')}
            title="Vista de detalle actual"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: 'none',
              background: viewMode === 'detailed' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'detailed' ? '#000' : 'var(--text-secondary)',
              fontWeight: viewMode === 'detailed' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Table size={14} />
            <span>Detalle</span>
          </button>
          <button
            onClick={() => setViewMode('historical')}
            title="Vista de serie temporal histórica"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: 'none',
              background: viewMode === 'historical' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'historical' ? '#000' : 'var(--text-secondary)',
              fontWeight: viewMode === 'historical' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={14} />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {viewMode === 'detailed' ? (
        <>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
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
                  const isRowPinned = pinnedProducts.some(p => p.pinnedId === r.pinnedId);

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
                          {onTogglePinItem && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePinItem(r.productId, r.categoryId, r.productName);
                              }}
                              title={isRowPinned ? 'Desfijar del gráfico' : 'Fijar en el gráfico'}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                color: isRowPinned ? (r.color || '#3b82f6') : '#64748b',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Pin size={13} fill={isRowPinned ? (r.color || '#3b82f6') : 'none'} color={isRowPinned ? (r.color || '#3b82f6') : '#64748b'} />
                            </button>
                          )}
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color, flexShrink: 0 }}></span>
                          {onSelectProductItem ? (
                            <button
                              onClick={() => onSelectProductItem(r.productId, r.categoryId)}
                              title="Seleccionar este producto en la gráfica"
                              className="table-product-link"
                            >
                              {r.productName}
                            </button>
                          ) : (
                            <span>{r.productName}</span>
                          )}
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
        </>
      ) : (
        /* HISTORICAL VIEW MATRIX: Columns = [Fecha, ActiveProduct, PinnedProduct1, PinnedProduct2...] */
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#0f172a' }}>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onTogglePinItem && activePinnedId && (
                      <button
                        onClick={() => onTogglePinItem(selectedProduct, selectedCategory, activeProductName)}
                        title="Fijar / desfijar este producto"
                        style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Pin size={13} fill={activePinnedObj ? activeColor : 'none'} color={activePinnedObj ? activeColor : '#64748b'} />
                      </button>
                    )}
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeColor, flexShrink: 0 }}></span>
                    <span>{activeProductName}</span>
                  </div>
                </th>
                {activePinnedProducts.map(p => (
                  <th key={p.pinnedId} style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {onTogglePinItem && (
                        <button
                          onClick={() => onTogglePinItem(p.productId, p.categoryId, p.productName)}
                          title="Desfijar del gráfico"
                          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Pin size={13} fill={p.color} color={p.color} />
                        </button>
                      )}
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }}></span>
                      {onSelectProductItem ? (
                        <button
                          onClick={() => onSelectProductItem(p.productId, p.categoryId)}
                          title="Seleccionar este producto en la gráfica"
                          className="table-product-link"
                        >
                          {p.productName}
                        </button>
                      ) : (
                        <span>{p.productName}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHistoricalDates.map((date) => {
                const activeVal = activeDateValueMap.get(date);

                return (
                  <tr key={date} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{date}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: activeColor }}>
                      {activeVal !== undefined && activeVal !== null ? `$${activeVal.toLocaleString()}` : '-'}
                    </td>
                    {activePinnedProducts.map(p => {
                      const pMap = pinnedDateValueMaps.get(p.pinnedId);
                      const val = pMap?.get(date);
                      return (
                        <td key={p.pinnedId} style={{ padding: '12px', fontWeight: 600, color: p.color }}>
                          {val !== undefined && val !== null ? `$${val.toLocaleString()}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Bottom Right Last Updated Indicator (Outside Table Container) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: isMock ? 'rgba(245, 158, 11, 0.12)' : 'rgba(30, 41, 59, 0.7)',
            border: isMock ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
            color: isMock ? '#f59e0b' : 'var(--text-secondary)',
            fontSize: '0.6875rem',
            fontWeight: 500
          }}
        >
          <Database size={11} color={isMock ? '#f59e0b' : 'var(--text-secondary)'} />
          <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act.: ${lastUpdated || 'Hoy'}`}</span>
        </div>
      </div>
    </div>
  );
};
