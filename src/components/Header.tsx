import React from 'react';
import { TrendingUp, Apple, Carrot, Database } from 'lucide-react';

// Custom Lucide-styled Broccoli Icon Component
export const BroccoliIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 28,
  color = '#22c55e',
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M7 11.5a3.5 3.5 0 0 1 0-7 4 4 0 0 1 7.4-1.3 3.5 3.5 0 0 1 2.6 6.3 3 3 0 0 1-1.5 5.5H8.5a3 3 0 0 1-1.5-3.5Z" />
    <path d="M12 14v7" />
    <path d="M9.5 17.5 12 15l2.5 2.5" />
  </svg>
);

interface HeaderProps {
  isMock: boolean;
  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp color="#10b981" size={28} />
            <Apple color="#ef4444" size={26} />
            <Carrot color="#f97316" size={26} />
            <BroccoliIcon color="#22c55e" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visualizador de Precios Mayoristas</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Database size={16} />
          <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act: ${lastUpdated || 'Hoy'}`}</span>
        </div>
      </div>
    </header>
  );
};
