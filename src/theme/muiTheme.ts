import { createTheme } from '@mui/material/styles';

// Create a comprehensive MUI theme with module-specific colors
const theme = createTheme({
  palette: {
    mode: 'light',
    // Module-specific color palette integrated directly
    devoluciones: {
      main: '#DC2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff'
    },
    pedido: {
      main: '#2563EB',
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff'
    },
    inventario: {
      main: '#16A34A',
      light: '#22c55e',
      dark: '#15803d',
      contrastText: '#ffffff'
    },
    comparador: {
      main: '#EA580C',
      light: '#f97316',
      dark: '#c2410c',
      contrastText: '#ffffff'
    },

    // Standard MUI palette colors, aligned with module colors where applicable
    primary: {
      main: '#2563EB', // Aligned with pedido
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#dc004e',
      light: '#f06292',
      dark: '#c51162',
      contrastText: '#ffffff'
    },
    error: {
      main: '#DC2626', // Aligned with devoluciones
      light: '#ef5350',
      dark: '#b91c1c',
      contrastText: '#ffffff'
    },
    info: {
  main: '#0EA5E9',
      light: '#29b6f6',
      dark: '#0284c7',
      contrastText: '#ffffff'
    },
    success: {
      main: '#16A34A', // Aligned with inventario
      light: '#4caf50',
      dark: '#15803d',
      contrastText: '#ffffff'
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
      disabled: '#9ca3af'
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.25rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.2
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.3
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43
    }
  },
  shape: {
    borderRadius: 8
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  ]
});

export default theme;