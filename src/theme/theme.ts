import { createContext, useContext } from 'react';
import type { Theme } from '../theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
