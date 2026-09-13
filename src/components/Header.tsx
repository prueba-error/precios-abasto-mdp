import { Broccoli, Carrot, Banana, Apple, ChartColumn, Database, Sun, Moon } from 'lucide-react';
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
  onResetHome?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMock,
  lastUpdated,
  allProducts,
  categories,
  onSelectProductFromSearch,
  onPinProductFromSearch,
  onResetHome,
  theme = 'dark',
  onToggleTheme
}) => {
  return (
    <header className="header-root">
      <div className="header-container">
        {/* Left Column: Title, Subtitle, Divider & Search Bar */}
        <div className="header-left-group">
          <div className="header-title-block">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              <a
                href="/"
                onClick={(e) => {
                  if (onResetHome) {
                    e.preventDefault();
                    onResetHome();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                title="Ir al inicio"
              >
                Abasto Central MDP
              </a>
            </h1>
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

        {/* Right Column: Icons (Top) + Controls & Last Updated (Bottom) */}
        <div className="header-right-group">
          <div className="header-icons">
            <Broccoli color="#1aa44f" className="header-icon-item" />
            <Apple color="#d32147" className="header-icon-item" />
            <Banana color="#d6dd43" className="header-icon-item" />
            <Carrot color="#eb7215" className="header-icon-item" />
            <ChartColumn color="#108cb9" className="header-icon-item" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                style={{
                  background: 'var(--bg-header-sub)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '9999px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={12} color="#f59e0b" />
                    <span>Claro</span>
                  </>
                ) : (
                  <>
                    <Moon size={12} color="#3b82f6" />
                    <span>Oscuro</span>
                  </>
                )}
              </button>
            )}

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: isMock ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-header-sub)',
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
      </div>
    </header>
  );
};
