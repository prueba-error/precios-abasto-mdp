import { Broccoli, Carrot, Banana, Apple, ChartColumn, Database } from 'lucide-react';
import React from 'react';
interface HeaderProps {
  isMock: boolean;

  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left Column: Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visualizador de Precios Mayoristas</p>
        </div>

        {/* Right Column: Icons (Top) + Last Updated Badge (Bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Broccoli color="#1aa44f" size={30} />
            <Apple color="#d32147" size={30} />
            <Banana color="#d6dd43" size={30} />
            <Carrot color="#eb7215" size={30} />
            <ChartColumn color="#108cb9" size={30} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: isMock ? '#f59e0b' : 'var(--text-secondary)' }}>
            <Database size={14} color={isMock ? '#f59e0b' : 'var(--text-secondary)'} />
            <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act.: ${lastUpdated || 'Hoy'}`}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
