import { Broccoli, Carrot, Banana, Apple, ChartColumn, Database } from 'lucide-react';
import React from 'react';
interface HeaderProps {
  isMock: boolean;

  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({ isMock, lastUpdated }) => {
  return (
    <header style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Abasto Central MDP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visualizador de Precios Mayoristas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <Database size={14} />
            <span>{isMock ? 'Modo Demo (Mock Data)' : `Última actualización: ${lastUpdated || 'Hoy'}`}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
          <Broccoli color="#1aa44f" size={32} />
          <Apple color="#d32147" size={32} />
          <Banana color="#d6dd43" size={32} />
          <Carrot color="#eb7215" size={32} />
          <ChartColumn color="#108cb9" size={32} />
        </div>
      </div>
    </header>
  );
};
