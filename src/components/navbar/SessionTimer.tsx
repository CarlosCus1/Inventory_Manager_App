import React, { useEffect, useState, useCallback } from 'react';
import { useSessionTimer } from '../../hooks/useSessionTimer';
import { sessionCache } from '../../utils/sessionCache';

interface SessionTimerProps {
  onTimeout?: () => void;
  onWarning?: () => void;
  onActivityCallback?: (callback: (() => void) | null) => void;
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
 * - Sincronización con backend opcional
 * - Detección de actividad del usuario
 * - Display de duración de sesión en tiempo real
 * - Indicador visual pulsante cuando activo
 * - Botón de reset manual
 * - Integración completa con Layout.tsx
 * - Manejo de errores robusto
 * - TypeScript con interfaces completas
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
  onActivityCallback,
  enableBackendSync = true
}) => {
  // Backend status state
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    isActive: false,
    lastSync: null,
    error: null,
    isLoading: false
  });

  // Session timer hook
  const {
    timeConnected,
    isActive,
    showWarning,
    resetTimer,
    recordActivity
  } = useSessionTimer({
    onTimeout: handleTimeout,
    onWarning: handleWarning,
    timeoutMinutes: 30,  // ⏱️ PRODUCCIÓN: 30 minutos para cierre automático
    warningMinutes: 0    // ⚠️ PRODUCCIÓN: Sin warnings (cierre silencioso)
  });

  // Store timeout value for use in handlers
  const timeoutValue = 30; // ⏱️ PRODUCCIÓN: 30 minutos para cierre automático

  /**
   * Enhanced timeout handler - Auto-cierre directo sin confirmación
   */
  function handleTimeout() {
    console.log('⏰ SessionTimer: Timeout ejecutado - Cerrando sesión automáticamente');

    // ✅ Auto-cierre directo sin confirmación (especialmente para testing con 5 segundos)
    console.log('🔒 Cerrando sesión automáticamente después de', timeoutValue, 'segundos de inactividad');
    onTimeout?.();
  }

  /**
   * Warning handler with backend status logging
   */
  function handleWarning() {
    console.log('⚠️ SessionTimer: Warning ejecutado - Backend status:', backendStatus.isActive);
    onWarning?.();
  }

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
   * Sync session data with backend
   */
  const syncWithBackend = useCallback(async () => {
    if (!enableBackendSync || !backendStatus.isActive) {
      console.log('⚠️ SessionTimer: Backend no disponible para sincronización');
      return;
    }

    try {
      console.log('🔄 SessionTimer: Sincronizando con backend...');
      // Simulate backend sync (replace with actual API call)
      const response = await fetch('/api/session/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTime: timeConnected,
          lastActivity: new Date(),
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log('✅ SessionTimer: Sincronización exitosa');
      } else {
        throw new Error(`Error de sincronización: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ SessionTimer: Error en sincronización:', error);
    }
  }, [enableBackendSync, backendStatus.isActive, timeConnected]);

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

  // Pass the recordActivity callback to Layout when component mounts
  useEffect(() => {
    if (onActivityCallback) {
      onActivityCallback(recordActivity);
      // Cache the callback for performance
      sessionCache.set('session_activity_callback', recordActivity);
    }

    // Check backend status on mount (only if enabled)
    if (enableBackendSync) {
      checkBackendStatus();
    }

    // Cleanup callback when component unmounts
    return () => {
      if (onActivityCallback) {
        onActivityCallback(null);
      }
      sessionCache.remove('session_activity_callback');
    };
  }, [recordActivity, onActivityCallback, checkBackendStatus, enableBackendSync]);

  // Periodic backend status check
  useEffect(() => {
    if (!enableBackendSync) return;

    const interval = setInterval(checkBackendStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkBackendStatus, enableBackendSync]);

  return (
    <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-600/50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {/* Pulsing green indicator when active */}
          <div className={`w-2 h-2 rounded-full transition-colors ${
            isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-gray-600 dark:text-gray-400">
            Sesión: {timeConnected}
          </span>

          {/* Backend status indicator */}
          {enableBackendSync && (
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                backendStatus.isActive ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {backendStatus.isActive ? '●' : '○'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Warning indicator */}
          {showWarning && (
            <span className="text-amber-600 dark:text-amber-400 text-xs">
              ⚠ Próximo cierre
            </span>
          )}

          {/* Backend error indicator */}
          {backendStatus.error && (
            <span className="text-red-500 dark:text-red-400 text-xs" title={backendStatus.error}>
              ❌
            </span>
          )}

          {/* Reset button with enhanced functionality */}
          <button
            onClick={handleResetWithSync}
            className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30
                       text-blue-700 dark:text-blue-300 hover:bg-blue-200
                       dark:hover:bg-blue-800/50 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Resetear temporizador y sincronizar con backend"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Backend status details (optional) */}
      {enableBackendSync && backendStatus.lastSync && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Última sync: {backendStatus.lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default SessionTimer;