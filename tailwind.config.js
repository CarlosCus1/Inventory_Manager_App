/** @type {import('tailwindcss').Config} */
import colors from './src/theme/muiTheme';

const muiPalette = colors.palette;

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
          'light-primary': muiPalette.devoluciones.main,
          'light-secondary': muiPalette.devoluciones.light,
          'dark-primary': muiPalette.devoluciones.dark,
          'dark-secondary': muiPalette.devoluciones.dark,
        },
        'pedido': {
          'light-primary': muiPalette.pedido.main,
          'light-secondary': muiPalette.pedido.light,
          'dark-primary': muiPalette.pedido.dark,
          'dark-secondary': muiPalette.pedido.dark,
        },
        'inventario': {
          'light-primary': muiPalette.inventario.main,
          'light-secondary': muiPalette.inventario.light,
          'dark-primary': muiPalette.inventario.dark,
          'dark-secondary': muiPalette.inventario.dark,
        },
        'comparador': {
          'light-primary': muiPalette.comparador.main,
          'light-secondary': muiPalette.comparador.light,
          'dark-primary': muiPalette.comparador.dark,
          'dark-secondary': muiPalette.comparador.dark,
        },
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