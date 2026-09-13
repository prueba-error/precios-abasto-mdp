import React from 'react';
import { Broccoli, Apple, Banana, Carrot, ChartColumn, LucideIcon } from 'lucide-react';

interface PatternItem {
  Icon: LucideIcon;
  left: string;
  rotation: number;
  animClass: string;
  delay: string;
}

export const BackgroundPattern: React.FC = () => {
  const iconColor = 'rgba(148, 163, 184, 0.18)'; // Subtle watermark slate color
  const iconSize = 22;

  // Staggered pattern definition following user sequence:
  // Row 1: Broccoli (left), Apple (right)
  // Row 2: ChartColumn (mid-left), ChartColumn (mid-right)
  // Row 3: Banana (left), Carrot (right)
  // Row 4: ChartColumn (mid-left), ChartColumn (mid-right)
  const patternUnit: PatternItem[] = [
    // Row 1
    { Icon: Broccoli, left: '5%', rotation: -12, animClass: 'bg-float-1', delay: '0s' },
    { Icon: Apple, left: '88%', rotation: 15, animClass: 'bg-float-2', delay: '1.5s' },

    // Row 2
    { Icon: ChartColumn, left: '26%', rotation: 8, animClass: 'bg-float-1', delay: '2.8s' },
    { Icon: ChartColumn, left: '68%', rotation: -10, animClass: 'bg-float-2', delay: '0.8s' },

    // Row 3
    { Icon: Banana, left: '8%', rotation: 18, animClass: 'bg-float-2', delay: '3.5s' },
    { Icon: Carrot, left: '84%', rotation: -14, animClass: 'bg-float-1', delay: '2.0s' },

    // Row 4
    { Icon: ChartColumn, left: '32%', rotation: -6, animClass: 'bg-float-2', delay: '1.0s' },
    { Icon: ChartColumn, left: '62%', rotation: 12, animClass: 'bg-float-1', delay: '4.2s' },
  ];

  const rowTopOffsets = ['5%', '28%', '53%', '78%'];
  const blockCount = 5;

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
        zIndex: -1, // Ensures icons sit strictly behind page background and content
        overflow: 'hidden'
      }}
    >
      {Array.from({ length: blockCount }).map((_, blockIndex) => {
        const blockTopPercent = (blockIndex * 100) / blockCount;

        return (
          <div
            key={`block-${blockIndex}`}
            style={{
              position: 'absolute',
              top: `${blockTopPercent}%`,
              left: 0,
              width: '100%',
              height: `${100 / blockCount}%`
            }}
          >
            {patternUnit.map((item, itemIndex) => {
              const IconComponent = item.Icon;
              const rowIndex = Math.floor(itemIndex / 2);
              const topOffset = rowTopOffsets[rowIndex];

              return (
                <div
                  key={`icon-${blockIndex}-${itemIndex}`}
                  className={item.animClass}
                  style={{
                    position: 'absolute',
                    top: topOffset,
                    left: item.left,
                    animationDelay: item.delay,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconComponent size={iconSize} color="currentColor" />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
