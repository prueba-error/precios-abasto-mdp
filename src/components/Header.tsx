import { Broccoli, Carrot, Banana, Apple, ChartColumn, Database } from 'lucide-react';
import React from 'react';
import { Product, Category } from '../types';
import { ProductSearch } from './ProductSearch';

interface HeaderProps {
  isMock: boolean;
  lastUpdated?: string;
  allProducts: Product[];
  categories: Category[];
  onSelectProductFromSearch: (product: Product) => void;
  onPinProductFromSearch?: (product: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMock,
  lastUpdated,
  allProducts,
  categories,
  onSelectProductFromSearch,
  onPinProductFromSearch
}) => {
  return (
    <header className="header-root">
      <div className="header-container">
        {/* Left Column: Title, Subtitle, Divider & Search Bar */}
        <div className="header-left-group">
          <div className="header-title-block">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 500 }}>Visualizador de Precios Mayoristas</p>
          </div>

          <div className="header-divider" />

          <div className="header-search-wrapper">
            <ProductSearch
              allProducts={allProducts}
              categories={categories}
              onSelectProduct={onSelectProductFromSearch}
              onPinProduct={onPinProductFromSearch}
              hideLabel={true}
            />
          </div>
        </div>

        {/* Right Column: Icons (Top) + Last Updated (Bottom) */}
        <div className="header-right-group">
          <div className="header-icons">
            <Broccoli color="#1aa44f" className="header-icon-item" />
            <Apple color="#d32147" className="header-icon-item" />
            <Banana color="#d6dd43" className="header-icon-item" />
            <Carrot color="#eb7215" className="header-icon-item" />
            <ChartColumn color="#108cb9" className="header-icon-item" />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              marginTop: '4px',
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
    </header>
  );
};
