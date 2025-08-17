/** @type {import('tailwindcss').Config} */
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

    // Anillos de foco por módulo (botones/enlaces)
    'focus:ring-devoluciones-light-primary', 'dark:focus:ring-devoluciones-dark-primary',
    'focus:ring-pedido-light-primary', 'dark:focus:ring-pedido-dark-primary',
    'focus:ring-inventario-light-primary', 'dark:focus:ring-inventario-dark-primary',
    'focus:ring-comparador-light-primary', 'dark:focus:ring-comparador-dark-primary',

    // Títulos/énfasis por módulo usados en PageHeader
    'text-devoluciones-light-primary', 'dark:text-devoluciones-dark-primary',
    'text-pedido-light-primary', 'dark:text-pedido-dark-primary',
    'text-inventario-light-primary', 'dark:text-inventario-dark-primary',
    'text-comparador-light-primary', 'dark:text-comparador-dark-primary',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // General background and text colors for light/dark mode
        'light-bg': '#F8FAFC', // slate-50
        'dark-bg': '#1A202C', // gray-900
        'light-text': '#1F2937', // gray-800
        'dark-text': '#E5E7EB', // gray-200

        // Paleta para Devoluciones (rojo)
        'devoluciones': {
          'light-primary': '#DC2626', // red-600
          'light-secondary': '#FEE2E2', // red-100
          'dark-primary': '#F87171', // red-400
          'dark-secondary': '#7F1D1D', // red-900
          'light-text': '#DC2626', // red-600
          'dark-text': '#FEE2E2', // red-100
        },
        // Paleta para Pedido (azul)
        'pedido': {
          'light-primary': '#2563EB', // blue-600
          'light-secondary': '#DBEAFE', // blue-100
          'dark-primary': '#60A5FA', // blue-400
          'dark-secondary': '#1E3A8A', // blue-900
          'light-text': '#2563EB', // blue-600
          'dark-text': '#DBEAFE', // blue-100
        },
        // Paleta para Inventario (verde)
        'inventario': {
          'light-primary': '#16A34A', // green-600
          'light-secondary': '#DCFCE7', // green-100
          'dark-primary': '#4ADE80', // green-400
          'dark-secondary': '#14532D', // green-900
          'light-text': '#16A34A', // green-600
          'dark-text': '#DCFCE7', // green-100
        },
        // Paleta para Comparador (naranja)
        'comparador': {
          'light-primary': '#EA580C', // orange-600
          'light-secondary': '#FFEDD5', // orange-100
          'dark-primary': '#FB923C', // orange-400
          'dark-secondary': '#7C2D12', // orange-900
          'light-text': '#EA580C', // orange-600
          'dark-text': '#FFEDD5', // orange-100
        },
        // Paleta para Planificador (azul cielo)
        'planificador': {
          'light-primary': '#0284C7', // sky-600
          'light-secondary': '#E0F2FE', // sky-100
          'dark-primary': '#38BDF8', // sky-400
          'dark-secondary': '#0C4A6E', // sky-900
          'light-text': '#0284C7',
          'dark-text': '#E0F2FE',
        },
      },
    },
  },
  plugins: [],
}