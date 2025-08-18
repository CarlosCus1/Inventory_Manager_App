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
    // Fondos por módulo (evita que se purguen las clases dinámicas)
    'bg-devoluciones-light-secondary', 'dark:bg-devoluciones-dark-secondary',
    'bg-pedido-light-secondary', 'dark:bg-pedido-dark-secondary',
    'bg-inventario-light-secondary', 'dark:bg-inventario-dark-secondary',
    'bg-comparador-light-secondary', 'dark:bg-comparador-dark-secondary',
    'bg-planificador-light-secondary', 'dark:bg-planificador-dark-secondary',

    // Anillos de foco por módulo (botones/enlaces)
    'focus:ring-devoluciones-light-primary', 'dark:focus:ring-devoluciones-dark-primary',
    'focus:ring-pedido-light-primary', 'dark:focus:ring-pedido-dark-primary',
    'focus:ring-inventario-light-primary', 'dark:focus:ring-inventario-dark-primary',
    'focus:ring-comparador-light-primary', 'dark:focus:ring-comparador-dark-primary',
    'focus:ring-planificador-light-primary', 'dark:focus:ring-planificador-dark-primary',

    // Títulos/énfasis por módulo usados en PageHeader
    'text-devoluciones-light-primary', 'dark:text-devoluciones-dark-primary',
    'text-pedido-light-primary', 'dark:text-pedido-dark-primary',
    'text-inventario-light-primary', 'dark:text-inventario-dark-primary',
    'text-comparador-light-primary', 'dark:text-comparador-dark-primary',
    'text-planificador-light-primary', 'dark:text-planificador-dark-primary',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // General background and text colors for light/dark mode
        'light-bg': muiPalette.background.default, 
        'dark-bg': muiPalette.grey[900], 
        'light-text': muiPalette.text.primary, 
        'dark-text': muiPalette.grey[200],

        // Paleta para Devoluciones (rojo)
        'devoluciones': {
          'light-primary': muiPalette.devoluciones.main,
          'light-secondary': muiPalette.devoluciones.light,
          'dark-primary': muiPalette.devoluciones.dark,
          'dark-secondary': muiPalette.devoluciones.dark,
          'light-text': muiPalette.devoluciones.main,
          'dark-text': muiPalette.devoluciones.light,
        },
        // Paleta para Pedido (azul)
        'pedido': {
          'light-primary': muiPalette.pedido.main,
          'light-secondary': muiPalette.pedido.light,
          'dark-primary': muiPalette.pedido.dark,
          'dark-secondary': muiPalette.pedido.dark,
          'light-text': muiPalette.pedido.main,
          'dark-text': muiPalette.pedido.light,
        },
        // Paleta para Inventario (verde)
        'inventario': {
          'light-primary': muiPalette.inventario.main,
          'light-secondary': muiPalette.inventario.light,
          'dark-primary': muiPalette.inventario.dark,
          'dark-secondary': muiPalette.inventario.dark,
          'light-text': muiPalette.inventario.main,
          'dark-text': muiPalette.inventario.light,
        },
        // Paleta para Comparador (naranja)
        'comparador': {
          'light-primary': muiPalette.comparador.main,
          'light-secondary': muiPalette.comparador.light,
          'dark-primary': muiPalette.comparador.dark,
          'dark-secondary': muiPalette.comparador.dark,
          'light-text': muiPalette.comparador.main,
          'dark-text': muiPalette.comparador.light,
        },
        // Paleta para Planificador (azul cielo)
        'planificador': {
          'light-primary': muiPalette.planificador.main,
          'light-secondary': muiPalette.planificador.light,
          'dark-primary': muiPalette.planificador.dark,
          'dark-secondary': muiPalette.planificador.dark,
          'light-text': muiPalette.planificador.main,
          'dark-text': muiPalette.planificador.light,
        },
      },
    },
  },
  plugins: [],
}