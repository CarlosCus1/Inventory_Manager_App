import React, { useState, useMemo, useEffect } from 'react';
import { theme as defaultTheme } from '../theme';
import { ThemeContext, ThemeMode } from './theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const storedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (storedMode) {
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    const currentTheme = mode === 'light' ? defaultTheme.light : defaultTheme.dark;
    return {
      ...defaultTheme,
      ...currentTheme,
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
