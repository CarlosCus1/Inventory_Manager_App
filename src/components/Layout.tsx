import React, { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './navbar/NotificationBell';
// import WhatsAppLink from './navbar/WhatsAppLink';
import { useAuth } from '../contexts/AuthContext';
import LiveDateTime from './navbar/LiveDateTime';
import InteractiveBackground from './background/InteractiveBackground';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const resetCurrentModule = useAppStore((state) => state.resetearModulo);
  const recordActivity = useAppStore((state) => state.recordActivity);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = logoutButtonRef.current;

    const handleLogoutClick = () => {
      if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
        logout();
        navigate('/');
      }
    };

    if (button) {
      button.addEventListener('click', handleLogoutClick);
    }

    return () => {
      if (button) {
        button.removeEventListener('click', handleLogoutClick);
      }
    };
  }, [logout, navigate]);

  // Map pathnames to module keys and styling presets
  const paletteMap: { [key: string]: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' } = {
    '/devoluciones': 'devoluciones',
    '/pedido': 'pedido',
    '/inventario': 'inventario',
    '/comparador': 'comparador',
  };

  const currentPalette = paletteMap[location.pathname];

  // Record activity when changing modules
  React.useEffect(() => {
    if (currentPalette) {
      recordActivity(currentPalette);
    }
  }, [currentPalette, recordActivity]);

  const pageBgClass =
    currentPalette === 'devoluciones' ? 'page-devoluciones' :
    currentPalette === 'pedido' ? 'page-pedido' :
    currentPalette === 'inventario' ? 'page-inventario' :
    currentPalette === 'comparador' ? 'page-comparador' : '';

  const handleClear = () => {
    if (!currentPalette) return;
    if (window.confirm('¿Desea limpiar la página actual? Esta acción eliminará todos los datos ingresados.')) {
      const mapToStoreKey: Record<string, 'devoluciones' | 'pedido' | 'inventario' | 'precios'> = {
        devoluciones: 'devoluciones',
        pedido: 'pedido',
        inventario: 'inventario',
        comparador: 'precios',
      };
      resetCurrentModule(mapToStoreKey[currentPalette] as 'devoluciones' | 'pedido' | 'inventario' | 'precios');
    }
  };

  const defaultModuleStats = [
    { name: 'Devoluciones', usage: 75, color: '#DC2626' },
    { name: 'Pedido', usage: 90, color: '#2563EB' },
    { name: 'Inventario', usage: 60, color: '#16A34A' },
    { name: 'Comparador', usage: 45, color: '#EA580C' },

  ];

  const defaultParticleColors = [
    '#DC2626', '#2563EB', '#16A34A', '#EA580C', '#0EA5E9'
  ];

  return (
    <div className={`min-h-screen relative ${pageBgClass} transition-colors duration-300`}>
      <InteractiveBackground 
        moduleStats={defaultModuleStats} 
        particleColors={defaultParticleColors} 
        className="absolute inset-0 z-0" 
      />

      {/* Enhanced navbar with improved glassmorphism */}
      <header className="navbar relative z-50">
        <div className="navbar-inner">
          {/* Logo and title */}
          <div className="navbar-title">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm">
              <span className="text-white font-bold text-lg">GI</span>
            </div>
            <span className="hidden sm:inline font-bold text-xl">Gestor de Inventario</span>
          </div>

          {/* Active module indicator with enhanced transparency */}
          {currentPalette && (
            <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full surface-glass module-${currentPalette}`}>
              <div 
                className="w-3 h-3 rounded-full animate-pulse shadow-sm" 
                style={{ backgroundColor: `var(--module-primary)` }}
              />
              <span className="text-sm font-semibold capitalize" style={{ color: `var(--module-primary)` }}>
                {currentPalette}
              </span>
            </div>
          )}

          {/* Navbar actions with improved styling */}
          <nav className="navbar-actions">
            <LiveDateTime />
            <NotificationBell />
            <button
              ref={logoutButtonRef}
              className="btn btn-module module-devoluciones interactive px-4 py-2"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              <span className="hidden md:inline font-medium">Cerrar sesión</span>
            </button>
            {!isHomePage && (
              <Link to="/home" className="btn btn-outline module-pedido interactive px-4 py-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden md:inline">Inicio</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      {/* Floating Buttons Container with improved transparency */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4">
        <div className="surface-glass rounded-full p-1">
          <ThemeToggle />
        </div>
        {currentPalette && (
          <button
            onClick={handleClear}
            className={`p-4 rounded-full btn-danger interactive shadow-lg`}
            title="Limpiar Módulo Actual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" />
            </svg>
          </button>
        )}
      </div>

      {/* Enhanced version badge with improved transparency */}
      <div className="fixed bottom-6 right-6 z-50 hidden sm:block select-none">
        <div className="group">
          <div className="surface-glass rounded-full px-5 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <span className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></span>
              <span className="font-semibold">cc Gestor v3.0</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;