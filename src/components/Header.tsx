import React from 'react';
import { TrendingUp, Database } from 'lucide-react';

interface HeaderProps {
  isMock: boolean;
  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TrendingUp color="#10b981" size={32} />
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
