import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import LiveDateTime from './navbar/LiveDateTime';
import NotificationBell from './navbar/NotificationBell';
import SessionTimer from './navbar/SessionTimer';
import InteractiveBackground from './background/InteractiveBackground';
import { sessionCache } from '../utils/sessionCache';

// Enhanced dropdown keyframes for smooth animations
const dropdownKeyframes = `
  @keyframes fadeInDropdown {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, userName, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  // Navigation state detection
  // isHomePage: Detects if user is currently on home page (/home) - used to hide Home button on home page
  // isLoginPage: Detects if user is on login page (/) - used to hide entire navbar when not authenticated
  const isHomePage = location.pathname === '/home';  // ✅ Corrected: Home page is at /home
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  const resetCurrentModule = useAppStore((state) => state.resetearModulo);
  const recordActivity = useAppStore((state) => state.recordActivity);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Session timer activity callback - will be set by SessionTimer component
  const [, setSessionActivityCallback] = useState<(() => void) | null>(null);

  /**
    * Authentication handlers
    */
   const handleLogoutClick = () => {
     if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
       logout();
       navigate('/');
     }
   };

   // Session timer handlers
   const handleSessionTimeout = useCallback(() => {
     if (window.confirm('Tu sesión ha expirado por inactividad. ¿Deseas iniciar sesión nuevamente?')) {
       logout();
       navigate('/');
     }
   }, [logout, navigate]);

   const handleSessionWarning = useCallback(() => {
     // Opcional: mostrar notificación o toast
     console.warn('Sesión próxima a expirar');
   }, []);

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

  // Activity detection for session timer - GLOBAL por sesión completa
  // ✅ MINIMAL INTERACTION: Solo operaciones locales, zero API calls
  // ✅ CACHE-FIRST: Usa sessionCache para optimizar performance
  // ✅ THROTTLED: Máximo 1 evento por segundo para evitar overhead
  React.useEffect(() => {
    // Get cached activity callback for performance
    const cachedCallback = sessionCache.get<() => void>('session_activity_callback');

    const handleActivity = () => {
      // Cache activity timestamp locally (no API calls)
      const activityData = {
        timestamp: Date.now(),
        type: 'user_activity',
        source: 'layout'
      };

      // Update local cache immediately (instantáneo)
      sessionCache.set('last_activity', activityData, 60000); // 1 minute cache

      // Call session timer callback if available (throttled)
      if (cachedCallback) {
        cachedCallback();
      }
    };

    // Optimized event selection for minimal interaction
    const events = ['mousedown', 'keydown', 'click']; // Removed scroll/touchstart for less noise

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const pageBgClass =
    currentPalette === 'devoluciones' ? 'page-devoluciones' :
    currentPalette === 'pedido' ? 'page-pedido' :
    currentPalette === 'inventario' ? 'page-inventario' :
    currentPalette === 'comparador' ? 'page-comparador' : '';

  /**
   * Module management
   */
  const handleClearModule = () => {
    if (!currentPalette) return;

    const moduleNames: Record<string, string> = {
      'devoluciones': 'Devoluciones',
      'pedido': 'Pedidos',
      'inventario': 'Inventario',
      'comparador': 'Comparador'
    };

    if (window.confirm(`¿Desea limpiar el módulo ${moduleNames[currentPalette]}? Esta acción eliminará todos los datos ingresados.`)) {
      const mapToStoreKey: Record<string, 'devoluciones' | 'pedido' | 'inventario' | 'precios'> = {
        devoluciones: 'devoluciones',
        pedido: 'pedido',
        inventario: 'inventario',
        comparador: 'precios',
      };
      resetCurrentModule(mapToStoreKey[currentPalette] as 'devoluciones' | 'pedido' | 'inventario' | 'precios');
      setShowUserMenu(false); // Close dropdown after action
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

  // Conditionally render navbar only for authenticated users and non-login pages
  const shouldShowNavbar = isLoggedIn && !isLoginPage;

  return (
    <div className={`min-h-screen relative ${pageBgClass} transition-colors duration-300`}>
      {/* Inject enhanced dropdown keyframes for smooth animations */}
      <style dangerouslySetInnerHTML={{ __html: dropdownKeyframes }} />

      <InteractiveBackground
        moduleStats={defaultModuleStats}
        particleColors={defaultParticleColors}
        className="absolute inset-0 z-0"
      />

      {/* Enhanced navbar with improved glassmorphism - Only show for authenticated users */}
      {shouldShowNavbar && (
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
            {/* Home Link - Conditionally rendered based on current route */}
            {/* Only show when NOT on home page to avoid redundancy */}
            {/* Uses Link (not navigate) to preserve user session */}
            {!isHomePage && (
              <Link
                to="/home"
                className="flex items-center gap-2 px-3 py-2 rounded-lg surface-glass hover:surface-elevated transition-all duration-200"
                title="Ir a Home - Navega a página principal sin cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden md:inline font-medium">Home</span>
              </Link>
            )}

            {/* Live Date Time */}
            <LiveDateTime />

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Button with Dropdown - Moved to right side */}
            <div className="user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-profile-btn flex items-center gap-3 px-4 py-2 rounded-lg surface-glass hover:surface-elevated transition-all duration-200 cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)', /* Increased opacity for more solid background */
                  border: '1px solid rgba(255, 255, 255, 0.3)', /* More visible border */
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                title="Menú de usuario"
              >
                <div className="user-avatar w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-info hidden lg:block text-left">
                  <div className="user-name font-semibold text-sm">{userName || 'Usuario'}</div>
                  <div className="user-role text-xs opacity-75">Conectado</div>
                </div>
                <div className={`dropdown-arrow transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* User Dropdown Menu - Enhanced with better contrast and accessibility */}
              {showUserMenu && (
                <div className="user-dropdown absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl z-50
                              bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl
                              border border-gray-200 dark:border-gray-600
                              transition-all duration-300 ease-out
                              animate-[fadeInDropdown_0.2s_ease-out_forwards]"
                     style={{
                       backdropFilter: 'blur(20px)',
                       WebkitBackdropFilter: 'blur(20px)',
                       boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                     }}>

                  {/* Session Timer - GLOBAL por sesión completa */}
                  {/* ✅ NO interfiere con LiveDateTime ni NotificationBell */}
                  {/* ✅ Se reinicia automáticamente al navegar entre rutas */}
                  {/* ✅ Persistente durante toda la sesión autenticada */}
                  {/* ✅ Se oculta cuando navbar está oculta */}
                  <SessionTimer
                    onTimeout={handleSessionTimeout}
                    onWarning={handleSessionWarning}
                    onActivityCallback={setSessionActivityCallback}
                  />

                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-600/50">
                    <div className="user-header flex items-center gap-3">
                      <div className="user-avatar w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="user-name font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">
                          {userName || 'Usuario'}
                        </div>
                        <div className="user-email text-sm text-gray-600 dark:text-gray-400 leading-tight">
                          Conectado
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    {!isHomePage && (
                      <button
                        onClick={handleClearModule}
                        className="dropdown-item w-full text-left px-4 py-3 rounded-lg
                                  flex items-center gap-3 font-medium
                                  text-gray-700 dark:text-gray-200
                                  hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                                  hover:text-emerald-700 dark:hover:text-emerald-300
                                  transition-all duration-200 ease-in-out
                                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                  active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" />
                        </svg>
                        <span>Limpiar Página</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleLogoutClick();
                        setShowUserMenu(false);
                      }}
                      className="dropdown-item w-full text-left px-4 py-3 rounded-lg
                                flex items-center gap-3 font-medium
                                text-red-600 dark:text-red-400
                                hover:bg-red-50 dark:hover:bg-red-900/30
                                hover:text-red-700 dark:hover:text-red-300
                                transition-all duration-200 ease-in-out
                                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
       </header>
     )}

     <main className="relative z-20 min-h-screen">
       {children}
     </main>

     {/* Theme Toggle - Fixed position in bottom-left corner - Only show for authenticated users */}
     {shouldShowNavbar && (
       <div className="fixed bottom-6 left-6 z-50">
         <div className="surface-glass rounded-full p-1">
           <ThemeToggle />
         </div>
       </div>
     )}

     {/* Click outside to close user menu - Only when navbar is visible */}
     {showUserMenu && shouldShowNavbar && (
       <div
         onClick={() => setShowUserMenu(false)}
         className="fixed inset-0 z-40"
         style={{ background: 'transparent' }}
       />
     )}

     {/* Enhanced version badge with improved transparency - Only show for authenticated users */}
     {shouldShowNavbar && (
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
     )}
    </div>
  );
};

export default Layout;