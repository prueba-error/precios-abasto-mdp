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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: isMock ? 'rgba(245, 158, 11, 0.12)' : '#1e293b',
              border: isMock ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #334155',
              color: isMock ? '#f59e0b' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 500,
              marginTop: '6px',
              width: 'fit-content'
            }}
          >
            <Database size={13} color={isMock ? '#f59e0b' : '#94a3b8'} />
            <span>{isMock ? 'Modo Demo (Mock Data)' : `Última act.: ${lastUpdated || 'Hoy'}`}</span>
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
