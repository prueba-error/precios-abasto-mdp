import React from 'react';
import { Broccoli, Apple, Banana, Carrot, ChartColumn, LucideIcon } from 'lucide-react';

export const BackgroundPattern: React.FC = () => {
  const iconColor = 'rgba(148, 163, 184, 0.15)'; // Subtle watermark slate color
  const iconSize = 20;

  // The 5 header icons in uniform sequence
  const icons: LucideIcon[] = [Broccoli, Apple, Banana, Carrot, ChartColumn];

  // Geometric diagonal grid dimensions:
  // colStep = 140px, rowStep = 70px
  // Shifting odd rows by colStep / 2 (70px) creates a perfect 45-degree diagonal pattern
  const colStep = 140;
  const rowStep = 70;

  const maxCols = 22; // Covers up to 3080px width
  const maxRows = 25; // Covers up to 1750px height

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
        zIndex: -1, // Sits strictly behind all page content and containers
        overflow: 'hidden'
      }}
    >
      {Array.from({ length: maxRows }).map((_, rowIdx) => {
        const top = rowIdx * rowStep;
        const isOddRow = rowIdx % 2 !== 0;
        const rowXOffset = isOddRow ? colStep / 2 : 0;

        return (
          <React.Fragment key={`row-${rowIdx}`}>
            {Array.from({ length: maxCols }).map((_, colIdx) => {
              const left = colIdx * colStep + rowXOffset - colStep / 2;
              const iconIndex = (rowIdx * 3 + colIdx) % icons.length;
              const IconComponent = icons[iconIndex];

              const diagonalIdx = rowIdx + colIdx;
              const delay = `${(diagonalIdx * 0.35) % 4}s`;

              return (
                <div
                  key={`cell-${rowIdx}-${colIdx}`}
                  className="bg-floating-icon"
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconColor,
                    animationDelay: delay
                  }}
                >
                  <IconComponent size={iconSize} color="currentColor" />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
