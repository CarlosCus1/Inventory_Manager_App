/** @type {import('tailwindcss').Config} */
import { createTheme } from '@mui/material/styles';

// Importar el tema MUI y crear una instancia para obtener los colores
const muiTheme = createTheme({
  palette: {
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
    primary: {
      main: '#2563EB',
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
      main: '#DC2626',
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
      main: '#16A34A',
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
  }
});

const muiPalette = muiTheme.palette;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Clases de módulos para evitar purging
    'module-devoluciones', 'module-pedido', 'module-inventario', 'module-comparador',
    
    // Botones por módulo
    'btn-module', 'btn-outline',
    
    // Inputs por módulo
    'input-module',
    
    // Superficies y cards
    'surface', 'surface-card', 'surface-elevated', 'glass',
    
    // Estados y animaciones
    'fade-in', 'slide-up', 'scale-in', 'interactive',
    
    // Utilidades de focus
    'focus-visible',
    
    // Grid responsive
    'grid-responsive',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Colores por módulo manteniendo compatibilidad
        'devoluciones': {
          '50': muiPalette.devoluciones.light,
          '100': muiPalette.devoluciones.main,
          '200': muiPalette.devoluciones.dark,
          'contrast': muiPalette.devoluciones.contrastText,
        },
        'pedido': {
          '50': muiPalette.pedido.light,
          '100': muiPalette.pedido.main,
          '200': muiPalette.pedido.dark,
          'contrast': muiPalette.pedido.contrastText,
        },
        'inventario': {
          '50': muiPalette.inventario.light,
          '100': muiPalette.inventario.main,
          '200': muiPalette.inventario.dark,
          'contrast': muiPalette.inventario.contrastText,
        },
        'comparador': {
          '50': muiPalette.comparador.light,
          '100': muiPalette.comparador.main,
          '200': muiPalette.comparador.dark,
          'contrast': muiPalette.comparador.contrastText,
        },
        // Colores principales de MUI
        'primary': {
          '50': muiPalette.primary.light,
          '100': muiPalette.primary.main,
          '200': muiPalette.primary.dark,
          'contrast': muiPalette.primary.contrastText,
        },
        'secondary': {
          '50': muiPalette.secondary.light,
          '100': muiPalette.secondary.main,
          '200': muiPalette.secondary.dark,
          'contrast': muiPalette.secondary.contrastText,
        },
        'error': {
          '50': muiPalette.error.light,
          '100': muiPalette.error.main,
          '200': muiPalette.error.dark,
          'contrast': muiPalette.error.contrastText,
        },
        'info': {
          '50': muiPalette.info.light,
          '100': muiPalette.info.main,
          '200': muiPalette.info.dark,
          'contrast': muiPalette.info.contrastText,
        },
        'success': {
          '50': muiPalette.success.light,
          '100': muiPalette.success.main,
          '200': muiPalette.success.dark,
          'contrast': muiPalette.success.contrastText,
        },
        // Colores de texto y fondo para modo oscuro
        'text': {
          'light': {
            'primary': muiPalette.text.primary,
            'secondary': muiPalette.text.secondary,
            'disabled': muiPalette.text.disabled,
          },
          'dark': {
            'primary': '#f9fafb',
            'secondary': '#d1d5db',
            'disabled': '#6b7280',
          }
        },
        'background': {
          'light': {
            'default': muiPalette.background.default,
            'paper': muiPalette.background.paper,
          },
          'dark': {
            'default': '#0f172a',
            'paper': '#1e293b',
          }
        },
        // Paleta de grises
        'grey': muiPalette.grey,
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'outline': '0 0 0 3px rgba(66, 153, 225, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
