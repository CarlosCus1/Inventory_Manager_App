import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore'; // Import useAppStore
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/'; // Re-added this line
  const resetCurrentModule = useAppStore((state) => state.resetearModulo); // Get resetearModulo action

  // Map pathnames to module keys and styling presets
  const paletteMap: { [key: string]: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' } = {
    '/devoluciones': 'devoluciones',
    '/pedido': 'pedido',
    '/inventario': 'inventario',
    '/comparador': 'comparador',
  };

  const currentPalette = paletteMap[location.pathname];

  // Page background and button classes by module (no theme toggle)
  const pageBgClass =
    currentPalette === 'devoluciones' ? 'page-devoluciones' :
    currentPalette === 'pedido' ? 'page-pedido' :
    currentPalette === 'inventario' ? 'page-inventario' :
    currentPalette === 'comparador' ? 'page-comparador' : '';

  const handleClear = () => {
    if (!currentPalette) return;
    if (window.confirm('¿Desea limpiar la página actual? Esta acción eliminará todos los datos ingresados.')) {
      const mapToStoreKey: Record<string, 'devoluciones' | 'pedido' | 'inventario' | 'precios' | 'planificador'> = {
        devoluciones: 'devoluciones',
        pedido: 'pedido',
        inventario: 'inventario',
        comparador: 'precios',
        planificador: 'planificador',
      };
      resetCurrentModule(mapToStoreKey[currentPalette] as 'devoluciones' | 'pedido' | 'inventario' | 'precios' | 'planificador');
    }
  };

  return (
    <div className={`min-h-screen relative ${pageBgClass} transition-colors duration-200`}>
      {/* capa sutil para profundidad */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="h-full w-full transition-colors duration-300"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.04) 100%)' }}
        />
      </div>

      {/* Navbar coherente con tema global por variables */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-title">
            Stock Manager
          </Link>
          <nav className="navbar-actions">
            {!isHomePage && (
              <Link to="/" className="btn-outline-pedido">
                Inicio
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        {children}
      </main>

      {/* Floating Theme Toggle */}
      <div className="fixed bottom-3 right-16 z-50">
        <ThemeToggle />
      </div>

      {/* Floating Reset Button */}
      {currentPalette && (
        <div className="fixed bottom-3 left-3 z-50">
          <button
            onClick={handleClear}
            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg"
            title="Limpiar Módulo Actual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" />
            </svg>
          </button>
        </div>
      )}

      {/* Badge discreto de versión en esquina inferior derecha */}
      <div className="fixed bottom-3 right-3 z-50 hidden sm:block select-none" title="Proyecto de Carlos Cusi — versión 3.0" aria-label="cc Gestor v3.0">
        <div
          className="rounded-full px-3 py-1 text-[11px] font-medium shadow-sm ring-1 backdrop-blur"
          style={{
            background: 'color-mix(in oklab, var(--panel) 78%, transparent)',
            color: 'var(--fg)',
            boxShadow: 'inset 0 0 0 1px var(--border)',
            opacity: 0.9
          }}
        >
          cc Gestor v3.0
        </div>
      </div>
    </div>
  );
};

export default Layout;
