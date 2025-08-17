import React from "react";
import { useTheme } from "../hooks/useTheme";

/**
 * Toggle de tema global (Dark/Light)
 * - Sin dependencia del sistema/navegador.
 * - Sincronizado en toda la app vía ThemeProvider.
 * - Persistencia en localStorage gestionada por el hook.
 */
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      title={`Cambiar a ${isDark ? "Light" : "Dark"}`}
      onClick={toggleTheme}
      className={
        `p-2 rounded-full shadow-lg transition hover:opacity-95 scale-110
        ${isDark ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`
      }
    >
      {/* Íconos con color vivo, relleno más claro según tema */}
      {isDark ? (
        // Sun icon (amarillo vivo)
        <svg width="18" height="18" viewBox="0 0 24 24" className="text-yellow-400" fill="currentColor" aria-hidden="true">
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 10.45l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-0v3h0zm0 19v-3h0v3h0zM4 12H1v0h3v0zm19 0h-3v0h3v0zM6.76 19.16l-1.42 1.42-1.79-1.8 1.41-1.41 1.8 1.79zM19.16 6.76l1.4-1.4 1.8 1.79-1.41 1.41-1.79-1.8zM12 6.5A5.5 5.5 0 1 1 6.5 12 5.51 5.51 0 0 1 12 6.5z" />
        </svg>
      ) : (
        // Moon icon (índigo vivo)
        <svg width="18" height="18" viewBox="0 0 24 24" className="text-indigo-500" fill="currentColor" aria-hidden="true">
          <path d="M21.75 15.5A9.75 9.75 0 0 1 8.5 2.25a.75.75 0 0 0-.93-.93A10.5 10.5 0 1 0 22.68 16.43a.75.75 0 0 0-.93-.93z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
