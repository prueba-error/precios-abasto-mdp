import { Broccoli, Carrot, Banana, Apple, ChartColumn, Database } from 'lucide-react';
import React from 'react';
interface HeaderProps {
  isMock: boolean;

  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header
      style={{
        width: '100%',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 0',
        marginBottom: '20px'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left Column: Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visualizador de Precios Mayoristas</p>
        </div>

        {/* Right Column: Icons (Top) + Last Updated (Bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Broccoli color="#1aa44f" size={28} />
            <Apple color="#d32147" size={28} />
            <Banana color="#d6dd43" size={28} />
            <Carrot color="#eb7215" size={28} />
            <ChartColumn color="#108cb9" size={28} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: isMock ? '#f59e0b' : 'var(--text-secondary)' }}>
            <Database size={13} color={isMock ? '#f59e0b' : 'var(--text-secondary)'} />
            <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act.: ${lastUpdated || 'Hoy'}`}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
