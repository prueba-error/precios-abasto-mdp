import React, { useState, useRef, useEffect } from 'react';
import { Product, Category } from '../types';
import { Search, X, AlertCircle } from 'lucide-react';

interface ProductSearchProps {
  allProducts: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  onPinProduct?: (product: Product) => void;
  hideLabel?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  allProducts,
  categories,
  onSelectProduct,
  onPinProduct,
  hideLabel = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const filteredProducts = normalizedQuery === '' 
    ? [] 
    : allProducts.filter(p => {
        if (p.id === 0) return false; // exclude basket generic options from search list
        const nameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nameNorm.includes(normalizedQuery);
      });

  const hasNoMatches = query.trim() !== '' && filteredProducts.length === 0;

  // Reset selected index when search list changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const handleSelect = (prod: Product) => {
    onSelectProduct(prod);
    setQuery(prod.name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handlePin = (prod: Product) => {
    if (onPinProduct) {
      onPinProduct(prod);
    } else {
      onSelectProduct(prod);
    }
    setQuery(prod.name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen && filteredProducts.length > 0) {
        setIsOpen(false);
      } else {
        handleClear();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const targetProd = (selectedIndex >= 0 && selectedIndex < filteredProducts.length)
        ? filteredProducts[selectedIndex]
        : (filteredProducts.length > 0 ? filteredProducts[0] : null);

      if (targetProd) {
        if (e.ctrlKey || e.metaKey) {
          handlePin(targetProd);
        } else {
          handleSelect(targetProd);
        }
      }
      return;
    }

    if (!isOpen || filteredProducts.length === 0) {
      if (e.key === 'ArrowDown' && filteredProducts.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: hideLabel ? '0' : '16px', width: '100%' }}>
      {!hideLabel && (
        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          Buscar producto
        </label>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', width: '100%' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 280px', maxWidth: '500px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe el nombre de un producto..."
            style={{
              width: '100%',
              padding: '9px 36px 9px 36px',
              borderRadius: '6px',
              background: '#0f172a',
              color: 'var(--text-primary)',
              border: hasNoMatches ? '1px solid #f87171' : '1px solid var(--border-color)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}

          {isOpen && filteredProducts.length > 0 && (
            <div
              ref={listRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                maxHeight: '240px',
                overflowY: 'auto',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                zIndex: 100,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            >
              {filteredProducts.map((p, idx) => {
                const catName = getCategoryName(p.category_id);
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isHighlighted ? '#334155' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                    {catName && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>
                        {catName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasNoMatches && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.8125rem', fontWeight: 500 }}>
            <AlertCircle size={15} />
            <span>No se encontraron coincidencias para "{query}"</span>
          </div>
        )}
      </div>
    </div>
  );
};
