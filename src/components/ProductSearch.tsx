import React, { useState, useRef, useEffect } from 'react';
import { Product, Category } from '../types';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  allProducts: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  allProducts,
  categories,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const handleSelect = (prod: Product) => {
    onSelectProduct(prod);
    setQuery(prod.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '16px', width: '100%', maxWidth: '50%' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
        Buscar producto
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
          placeholder="Escribe el nombre de un producto..."
          style={{
            width: '100%',
            padding: '9px 36px 9px 36px',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
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
      </div>

      {isOpen && filteredProducts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '240px',
            overflowY: 'auto',
            background: '#1e293b',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          {filteredProducts.map(p => {
            const catName = getCategoryName(p.category_id);
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
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
  );
};
