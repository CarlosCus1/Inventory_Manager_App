import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './navbar/NotificationBell';
import WhatsAppLink from './navbar/WhatsAppLink';
import LiveDateTime from './navbar/LiveDateTime';
import InteractiveBackground from './background/InteractiveBackground';
import { mockRootProps } from '../enhancedAppMockData';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const resetCurrentModule = useAppStore((state) => state.resetearModulo);
  const recordActivity = useAppStore((state) => state.recordActivity);

  // Map pathnames to module keys and styling presets
  const paletteMap: { [key: string]: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador' } = {
    '/devoluciones': 'devoluciones',
    '/pedido': 'pedido',
    '/inventario': 'inventario',
    '/comparador': 'comparador',
    '/planificador': 'planificador',
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
    currentPalette === 'comparador' ? 'page-comparador' :
    currentPalette === 'planificador' ? 'page-planificador' : '';

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

  const defaultModuleStats = [
    { name: 'Devoluciones', usage: 75, color: '#DC2626' },
    { name: 'Pedido', usage: 90, color: '#2563EB' },
    { name: 'Inventario', usage: 60, color: '#16A34A' },
    { name: 'Comparador', usage: 45, color: '#EA580C' },
    { name: 'Planificador', usage: 30, color: '#0EA5E9' },
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

      {/* Enhanced navbar with glassmorphism */}
      <header className="navbar navbar-glass relative z-50">
        <div className="navbar-inner">
          {/* Logo and title */}
          <Link to="/" className="navbar-title flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-sm">GI</span>
            </div>
            <span className="hidden sm:inline">Gestor de Inventario</span>
          </Link>

          {/* Active module indicator */}
          {currentPalette && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 dark:bg-white/10">
              <div 
                className="w-2 h-2 rounded-full animate-pulse" 
                style={{ 
                  backgroundColor: currentPalette === 'devoluciones' ? '#DC2626' :
                                 currentPalette === 'pedido' ? '#2563EB' :
                                 currentPalette === 'inventario' ? '#16A34A' :
                                 currentPalette === 'comparador' ? '#EA580C' : '#0EA5E9'
                }} 
              />
              <span className="text-xs font-medium capitalize">{currentPalette}</span>
            </div>
          )}

          {/* Navbar actions */}
          <nav className="navbar-actions">
            <LiveDateTime />
            <NotificationBell />
            <WhatsAppLink 
              phoneNumber={mockRootProps.phoneNumber}
              message={mockRootProps.supportMessage}
            />
            {!isHomePage && (
              <Link to="/" className="btn-outline-pedido">
                🏠 Inicio
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      {/* Floating Buttons Container */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-3">
        <ThemeToggle />
        {currentPalette && (
          <button
            onClick={handleClear}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg hover:scale-110 transition-all duration-200"
            title="Limpiar Módulo Actual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" />
            </svg>
          </button>
        )}
      </div>

      {/* Enhanced version badge */}
      <div className="fixed bottom-4 right-4 z-50 hidden sm:block select-none">
        <div className="group">
          <div 
            className="rounded-full px-4 py-2 text-xs font-medium shadow-lg ring-1 backdrop-blur-md transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              color: 'var(--fg)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              cc Gestor v3.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;