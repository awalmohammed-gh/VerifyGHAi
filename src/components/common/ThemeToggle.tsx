import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'segmented';
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button',
  size = 'md',
}) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 ${className}`}
        role="group"
        aria-label="Select color theme"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span className="hidden sm:inline">Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="System Synchronized"
        >
          <Monitor className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>
    );
  }

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      id="theme-toggle-button"
      onClick={toggleTheme}
      className={`relative rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
        isSmall ? 'p-1.5 text-xs' : 'p-2.5'
      } text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 border border-transparent dark:border-slate-800 ${className}`}
      aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode (Current: ${theme})`}
    >
      {actualTheme === 'dark' ? (
        <Sun className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-amber-400 transition-transform duration-200`} />
      ) : (
        <Moon className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-slate-600 transition-transform duration-200`} />
      )}
    </button>
  );
};
