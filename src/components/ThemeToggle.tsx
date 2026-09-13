import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggleTheme,
  className = ''
}) => {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-switch ${className}`}
      role="switch"
      aria-checked={isLight}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={onToggleTheme}
    >
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__icon theme-switch__icon--sun">
          <Sun size={13} />
        </span>
        <span className="theme-switch__thumb" />
        <span className="theme-switch__icon theme-switch__icon--moon">
          <Moon size={13} />
        </span>
      </span>
    </button>
  );
};
