import React from 'react';
import { Broccoli, Apple, Banana, Carrot, ChartColumn, LucideIcon } from 'lucide-react';

export const BackgroundPattern: React.FC = () => {
  const iconColor = 'rgba(148, 163, 184, 0.22)';
  const iconSize = 22;

  // Exact 4-row, 4-column pattern:
  // Row 1: [Broccoli, null, null, Apple]
  // Row 2: [null, ChartColumn, ChartColumn, null]
  // Row 3: [Banana, null, null, Carrot]
  // Row 4: [null, ChartColumn, ChartColumn, null]
  const patternRows: (LucideIcon | null)[][] = [
    [Broccoli, null, null, Apple],
    [null, ChartColumn, ChartColumn, null],
    [Banana, null, null, Carrot],
    [null, ChartColumn, ChartColumn, null],
  ];

  // Repeat 6 blocks to cover viewport height
  const fullRows = Array.from({ length: 6 }).flatMap((_, blockIdx) =>
    patternRows.map((row, rowIdx) => ({
      cells: row,
      blockIdx,
      rowIdx,
      globalRowIdx: blockIdx * 4 + rowIdx
    }))
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '24px 40px'
      }}
    >
      {fullRows.map((rowObj) => (
        <div
          key={`row-${rowObj.globalRowIdx}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            width: '100%',
            alignItems: 'center'
          }}
        >
          {rowObj.cells.map((IconComponent, colIdx) => {
            if (!IconComponent) {
              return <div key={`cell-${rowObj.globalRowIdx}-${colIdx}`} />;
            }

            const delay = `${((rowObj.globalRowIdx * 0.8) + colIdx * 0.5) % 4}s`;

            return (
              <div
                key={`cell-${rowObj.globalRowIdx}-${colIdx}`}
                className="bg-floating-icon"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  animationDelay: delay,
                  color: iconColor
                }}
              >
                <IconComponent size={iconSize} color="currentColor" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
