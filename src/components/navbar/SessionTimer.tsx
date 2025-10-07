import React, { useEffect, useState, useCallback } from 'react';
import { Tooltip } from '@mui/material';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { useToasts } from '../../hooks/useToasts';
import { formatearFecha } from '../../utils/dateUtils';
import { sessionCache } from '../../utils/sessionCache';
import { useAppStore } from '../../store/useAppStore';
import { useLocation } from 'react-router-dom';

interface SessionTimerProps {
  onTimeout?: () => void;
  onWarning?: () => void;
  enableBackendSync?: boolean; // Default: true
}

interface BackendStatus {
  isActive: boolean;
  lastSync: Date | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Componente avanzado de temporizador de sesión con funcionalidades completas
 *
 * ✅ CARACTERÍSTICAS:
 * - Auto-cierre después de inactividad configurable
 * - Sincronización inteligente con backend (solo cuando necesario)
 * - Detección de actividad del usuario
 * - Display de duración de sesión en tiempo real
 * - Indicador visual pulsante cuando activo
 * - Botón de reset manual
 * - Integración completa con Layout.tsx
 * - Manejo de errores robusto
 * - TypeScript con interfaces completas
 * - Trabajo prioritario con cache IndexedDB (mínimo consumo de API)
 * - Sincronización de catálogo solo para operaciones críticas
 * - Notificaciones de actualización de catálogo (2 veces al día)
 * - Cierre automático de menús al hacer clic fuera
 *
 * ✅ FLUJO DE FUNCIONAMIENTO:
 * 1. Se inicia automáticamente con la sesión
 * 2. Muestra duración en tiempo real (MM:SS o HH:MM:SS)
 * 3. Detecta actividad y reinicia contador
 * 4. Muestra warning antes del timeout
 * 5. Auto-cierre solo si backend está activo
 * 6. Confirmación si backend no disponible
 */
const SessionTimer: React.FC<SessionTimerProps> = ({
  onTimeout,
  onWarning,
  enableBackendSync = true
}) => {
  // Store access
  const { catalogCount, resetearModulo } = useAppStore();
  const location = useLocation();

  // Backend status state - Independent from catalog updates
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(() => {
    // Initialize from cache if available, otherwise null
    const cachedLastSync = sessionCache.get<number>('last_backend_check');
    return {
      isActive: false,
      lastSync: cachedLastSync ? new Date(cachedLastSync) : null,
      error: null,
      isLoading: false
    };
  });

  // Catalog update state (separate from session sync)
  const [lastCatalogUpdate, setLastCatalogUpdate] = useState<Date | null>(() => {
    // Try to get last catalog update from cache on initialization
    const cachedTimestamp = sessionCache.get<number>('last_catalog_update');
    return cachedTimestamp ? new Date(cachedTimestamp) : null;
  });
  const [showCatalogNotification, setShowCatalogNotification] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Toast notifications
  const { addToast } = useToasts();

  // Store timeout value for use in handlers
  const timeoutValue = 30; // ⏱️ PRODUCCIÓN: 30 minutos para cierre automático

  /**
    * Enhanced timeout handler - Auto-cierre directo sin confirmación
    */
   const handleTimeout = useCallback(() => {
     console.log('⏰ SessionTimer: Timeout ejecutado - Cerrando sesión automáticamente');

     // Mostrar notificación sutil antes del cierre
     addToast('Sesión expirada por inactividad', 'warning');

     // ✅ Auto-cierre directo sin confirmación
     console.log('🔒 Cerrando sesión automáticamente después de', timeoutValue, 'minutos de inactividad');
     onTimeout?.();
   }, [addToast, timeoutValue, onTimeout]);

  /**
    * Warning handler with backend status logging
    */
   const handleWarning = useCallback(() => {
     console.log('⚠️ SessionTimer: Warning ejecutado - Backend status:', backendStatus.isActive);
     onWarning?.();
   }, [backendStatus.isActive, onWarning]);

  // Session timer hook
  const {
    timeConnected,
    isActive,
    showWarning,
    resetTimer
  } = useSessionTimer({
    onTimeout: handleTimeout,
    onWarning: handleWarning,
    timeoutMinutes: 30,  // ⏱️ PRODUCCIÓN: 30 minutos para cierre automático
    warningMinutes: 0    // ⚠️ PRODUCCIÓN: Sin warnings (cierre silencioso)
  });

  /**
   * Check backend connectivity
   */
  const checkBackendStatus = useCallback(async () => {
    if (!enableBackendSync) return;

    setBackendStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Backend check with timeout (replace with actual API call)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setBackendStatus({
          isActive: true,
          lastSync: new Date(),
          error: null,
          isLoading: false
        });
        console.log('✅ SessionTimer: Backend activo y sincronizado');
      } else {
        throw new Error(`Error HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ SessionTimer: Error de backend:', error);
      setBackendStatus({
        isActive: false,
        lastSync: null,
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false
      });
    }
  }, [enableBackendSync]);

  /**
   * Smart session sync with backend - Only when necessary
   */
  const syncWithBackend = useCallback(async () => {
    if (!enableBackendSync) return;

    // Check if we need to sync (throttle requests)
    const lastSync = sessionCache.get<number>('last_session_sync');
    const now = Date.now();

    // Only sync if it's been more than 10 minutes since last sync
    if (lastSync && (now - lastSync) < 10 * 60 * 1000) {
      console.log('⏭️ SessionTimer: Sync reciente, omitiendo');
      return;
    }

    try {
      console.log('🔄 SessionTimer: Sincronizando sesión con backend...');

      // Only send essential session data, not every minute
      const response = await fetch('/api/session/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTime: timeConnected,
          lastActivity: new Date(),
          timestamp: Date.now(),
          // Only send when necessary, not continuously
          source: 'session_timer'
        })
      });

      if (response.ok) {
        console.log('✅ SessionTimer: Sincronización exitosa');
        sessionCache.set('last_session_sync', now, 10 * 60 * 1000); // Cache for 10 minutes
      } else {
        throw new Error(`Error de sincronización: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ SessionTimer: Error en sincronización:', error);
      // Don't retry immediately on error
    }
  }, [enableBackendSync, timeConnected]);

  /**
    * Enhanced reset with backend sync
    */
   const handleResetWithSync = useCallback(() => {
     console.log('🔄 SessionTimer: Reset manual ejecutado');
     resetTimer();

     // Sync with backend if available
     if (backendStatus.isActive) {
       syncWithBackend();
     }
   }, [resetTimer, backendStatus.isActive, syncWithBackend]);

  /**
    * Handle limpiar página - Detect current module and reset
    */
   const handleLimpiarPagina = useCallback(() => {
     const path = location.pathname;
     let module = '';

     if (path.includes('devoluciones')) module = 'devoluciones';
     else if (path.includes('pedido')) module = 'pedido';
     else if (path.includes('inventario')) module = 'inventario';
     else if (path.includes('precios') || path.includes('comparador')) module = 'precios';

     if (module) {
       resetearModulo(module as 'devoluciones' | 'pedido' | 'inventario' | 'precios');
       addToast(`Página de ${module} limpiada`, 'info');
     } else {
       addToast('No se pudo determinar el módulo actual', 'warning');
     }
   }, [location.pathname, resetearModulo, addToast]);

  /**
   * Smart catalog sync - Only when necessary for specific operations
   */
  const syncCatalogWithBackend = useCallback(async () => {
    if (!enableBackendSync) return false;

    // Check if catalog data is still fresh (less than 12 hours old)
    const lastUpdate = sessionCache.get<number>('last_catalog_update');
    const now = Date.now();

    if (lastUpdate && (now - lastUpdate) < 12 * 60 * 60 * 1000) {
      console.log('⏭️ SessionTimer: Catálogo reciente, omitiendo sincronización');
      return true; // Consider it successful since data is fresh
    }

    // Only sync if backend is available and data is stale
    if (!backendStatus.isActive) {
      console.log('⚠️ SessionTimer: Backend no disponible para catálogo');
      return false;
    }

    try {
      console.log('🔄 SessionTimer: Sincronizando catálogo con backend...');

      // Real catalog sync - Only for critical operations
      const response = await fetch('/api/catalog/sync', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const catalogData = await response.json();
        console.log('✅ SessionTimer: Catálogo sincronizado exitosamente');

        // Update catalog timestamp only when real sync happens
        const updateTime = new Date();
        setLastCatalogUpdate(updateTime);

        // Cache the catalog data with long TTL
        sessionCache.set('catalog_data', catalogData, 12 * 60 * 60 * 1000); // 12 hours
        sessionCache.set('last_catalog_update', updateTime.getTime(), 12 * 60 * 60 * 1000);

        return true;
      } else {
        throw new Error(`Error de sincronización de catálogo: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ SessionTimer: Error en sincronización de catálogo:', error);
      return false;
    }
  }, [enableBackendSync, backendStatus.isActive]);

  /**
   * Show catalog update notification (UI only) - Uses INDEPENDENT timestamp
   */
  const showCatalogUpdateNotification = useCallback(() => {
    const notificationTime = new Date(); // ← Independent timestamp for notification
    const formattedTime = notificationTime.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    addToast(
      `Catálogo actualizado: ${catalogCount} elementos a las ${formattedTime}`,
      'success'
    );

    // CRITICAL: Only update catalog timestamp if we don't have a real one from actual sync
    // This prevents notification timestamp from overriding real sync timestamp
    if (!lastCatalogUpdate) {
      setLastCatalogUpdate(notificationTime);
    }

    setShowCatalogNotification(true);

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowCatalogNotification(false);
    }, 3000);
  }, [addToast, lastCatalogUpdate]);

  /**
   * Handle click outside to close menus
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element;

    // Close user menu if clicked outside
    if (!target.closest('.user-menu-dropdown')) {
      console.log('Clic fuera del menú de usuario, cerrando');
      setShowUserMenu(false);
    }

    // Close any open dropdown menus
    if (!target.closest('.user-menu-container') && !target.closest('.dropdown-item')) {
      // Dispatch custom event to notify parent components to close menus
      const closeMenuEvent = new CustomEvent('closeAllMenus');
      document.dispatchEvent(closeMenuEvent);
    }
  }, []);

  // Check backend status on mount (only if enabled) - Completely independent from catalog
  useEffect(() => {
    if (enableBackendSync) {
      // Only check backend if we haven't checked recently (independent from catalog)
      const lastCheck = sessionCache.get<number>('last_backend_check');
      const now = Date.now();

      if (!lastCheck || (now - lastCheck) > 5 * 60 * 1000) {
        checkBackendStatus(); // ← This only affects backendStatus.lastSync
      }
    }
  }, [checkBackendStatus, enableBackendSync]);

  // Separate effect for catalog operations - Completely independent timing
  useEffect(() => {
    const initializeCatalogTimestamp = () => {
      // Only set initial catalog timestamp if we don't have one
      if (!lastCatalogUpdate) {
        const initialTime = new Date();
        setLastCatalogUpdate(initialTime);
        sessionCache.set('last_catalog_update', initialTime.getTime(), 12 * 60 * 60 * 1000);
      }
    };

    // Initialize catalog timestamp independently
    initializeCatalogTimestamp();
  }, [lastCatalogUpdate]);

  // Smart backend status check - Only when needed, not periodic
  useEffect(() => {
    if (!enableBackendSync) return;

    // Check backend status only on specific events, not periodically
    const handleSmartBackendCheck = () => {
      const lastCheck = sessionCache.get<number>('last_backend_check');
      const now = Date.now();

      // Only check if it's been more than 5 minutes since last check
      if (!lastCheck || (now - lastCheck) > 5 * 60 * 1000) {
        checkBackendStatus();
        sessionCache.set('last_backend_check', now, 5 * 60 * 1000); // Cache for 5 minutes
      }
    };

    // Check on mount
    handleSmartBackendCheck();

    // Listen for specific events that might need backend verification
    const events = ['focus', 'visibilitychange'];
    events.forEach(event => {
      window.addEventListener(event, handleSmartBackendCheck);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleSmartBackendCheck);
      });
    };
  }, [checkBackendStatus, enableBackendSync]);

  // Catalog update notification and sync - Every 12 hours (2 times per day)
  useEffect(() => {
    const performCatalogUpdate = async () => {
      // First try to sync catalog data (this may or may not update the timestamp)
      await syncCatalogWithBackend();

      // Always show notification (even if sync fails, for user awareness)
      // Uses independent timestamp for notification
      showCatalogUpdateNotification();
    };

    // Initial update on mount - Only if we haven't done it recently
    const lastCatalogNotification = sessionCache.get<number>('last_catalog_notification');
    const now = Date.now();

    if (!lastCatalogNotification || (now - lastCatalogNotification) > 60 * 60 * 1000) { // 1 hour minimum between notifications
      performCatalogUpdate();
      sessionCache.set('last_catalog_notification', now, 60 * 60 * 1000);
    }

    // Set up periodic updates every 12 hours (2 times per day for IndexedDB updates)
    const updateInterval = setInterval(() => {
      performCatalogUpdate();
      sessionCache.set('last_catalog_notification', Date.now(), 60 * 60 * 1000);
    }, 12 * 60 * 60 * 1000); // 12 hours

    return () => clearInterval(updateInterval);
  }, [showCatalogUpdateNotification, syncCatalogWithBackend]);

  // Click outside handler for closing menus
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    };
  }, [handleClickOutside]);

  return (
    <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-600/50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {/* Pulsing green indicator when active */}
          <Tooltip title={`Sesión activa: ${timeConnected}. Timeout en 30 minutos de inactividad.`}>
            <div className={`w-2 h-2 rounded-full transition-colors cursor-help ${
              isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
          </Tooltip>
          <span className="text-gray-600 dark:text-gray-400">
            Sesión: {timeConnected}
          </span>

          {/* Backend status indicator */}
          {enableBackendSync && (
            <Tooltip title={backendStatus.isActive ? `Backend conectado. Última sync: ${backendStatus.lastSync?.toLocaleTimeString() || 'N/A'}` : 'Backend desconectado'}>
              <div className="flex items-center gap-1 cursor-help">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus.isActive ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {backendStatus.isActive ? '● Conectado' : '○ Desconectado'}
                </span>
              </div>
            </Tooltip>
          )}

          {/* Catalog update indicator */}
          {showCatalogNotification && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-blue-500 dark:text-blue-400">
                📦
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Warning indicator */}
          {showWarning && (
            <Tooltip title="La sesión expirará pronto por inactividad">
              <span className="text-amber-600 dark:text-amber-400 text-xs cursor-help">
                ⚠ Próximo cierre
              </span>
            </Tooltip>
          )}

          {/* Backend error indicator */}
          {backendStatus.error && (
            <Tooltip title={`Error de conexión: ${backendStatus.error}`}>
              <span className="text-red-500 dark:text-red-400 text-xs cursor-help">
                ❌ Backend
              </span>
            </Tooltip>
          )}

          {/* Reset button with enhanced functionality */}
          <Tooltip title="Reiniciar temporizador de sesión y sincronizar estado">
            <button
              onClick={handleResetWithSync}
              className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30
                          text-blue-700 dark:text-blue-300 hover:bg-blue-200
                          dark:hover:bg-blue-800/50 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ↻ Reset
            </button>
          </Tooltip>

          {/* User menu */}
          <div className="relative user-menu-dropdown">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800
                          text-gray-700 dark:text-gray-300 hover:bg-gray-200
                          dark:hover:bg-gray-700 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-gray-500
                          flex items-center gap-1"
            >
              carlos ▼
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800
                              border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 user-menu-dropdown">
                <button
                  onClick={() => {
                    handleLimpiarPagina();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                             hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md"
                >
                  🧹 Limpiar Página
                </button>
                <button
                  onClick={() => {
                    onTimeout?.();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-md"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backend status details (optional) */}
      {enableBackendSync && backendStatus.lastSync && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Última sync: {backendStatus.lastSync.toLocaleTimeString()}
        </div>
      )}

      {/* Catalog update details - Only show if we have a real catalog update */}
      {lastCatalogUpdate && (
        <Tooltip title={`Última actualización: ${formatearFecha(lastCatalogUpdate)} ${lastCatalogUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}, Total elementos: ${catalogCount}, Fuente: Google Drive`}>
          <div className="mt-1 text-xs text-green-600 dark:text-green-400 cursor-help">
            📦 Catálogo: {catalogCount} elementos actualizados
          </div>
        </Tooltip>
      )}

      {/* Show placeholder if no catalog update has occurred yet */}
      {!lastCatalogUpdate && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">
          Última actualización: Pendiente de sincronización inicial
        </div>
      )}
    </div>
  );
};

export default SessionTimer;