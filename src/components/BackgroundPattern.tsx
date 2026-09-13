import React from 'react';
import { Broccoli, Apple, Banana, Carrot, ChartColumn } from 'lucide-react';

export const BackgroundPattern: React.FC = () => {
  // Pattern definition:
  // Row 0: Broccoli (left), Apple (right)
  // Row 1: ChartColumn (mid-left), ChartColumn (mid-right)
  // Row 2: Banana (left), Carrot (right)
  // Row 3: ChartColumn (mid-left), ChartColumn (mid-right)

  const iconColor = 'rgba(71, 85, 105, 0.35)'; // Slightly lighter slate than background #0f172a
  const iconSize = 20;

  const rows = [
    { type: 'outer', left: Broccoli, right: Apple },
    { type: 'inner', left: ChartColumn, right: ChartColumn },
    { type: 'outer', left: Banana, right: Carrot },
    { type: 'inner', left: ChartColumn, right: ChartColumn },
  ];

  // Repeat the 4-row block to fill the screen height
  const repeatedRows = Array.from({ length: 14 }).flatMap((_, blockIndex) =>
    rows.map((row, rowIndex) => ({
      ...row,
      id: `bg-row-${blockIndex}-${rowIndex}`,
      index: blockIndex * 4 + rowIndex
    }))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '16px 0'
      }}
      aria-hidden="true"
    >
      {repeatedRows.map((item) => {
        const LeftIcon = item.left;
        const RightIcon = item.right;
        const isInner = item.type === 'inner';
        const delayLeft = `${(item.index * 0.7) % 6}s`;
        const delayRight = `${((item.index * 0.7) + 3) % 6}s`;

        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              paddingLeft: isInner ? '36%' : '8%',
              paddingRight: isInner ? '36%' : '8%'
            }}
          >
            <div
              className="bg-floating-icon"
              style={{
                animationDelay: delayLeft,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LeftIcon size={iconSize} color="currentColor" />
            </div>
            <div
              className="bg-floating-icon"
              style={{
                animationDelay: delayRight,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RightIcon size={iconSize} color="currentColor" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
