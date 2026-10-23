import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '@/lib/types';

export function useTheme(): {
  theme: Theme;
  toggleTheme: () => void;
} {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('niftypulse-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('niftypulse-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
