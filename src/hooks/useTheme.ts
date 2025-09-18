import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { theme as appTheme, Theme as AppTheme } from "../theme";

/**
 * Tema global independiente del navegador/sistema.
 * Fuente de verdad: localStorage + toggle manual.
 * Aplica/remueve la clase 'dark' en <html> (document.documentElement) para Tailwind.
 */

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
  theme: AppTheme;
};

const THEME_STORAGE_KEY = "app_theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  // Valor por defecto de la app (independiente del sistema/navegador)
  return "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  // Aplica/remueve clase 'dark' en <html> y persiste en localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Actualizar meta[name="theme-color"] progresivamente (Chrome/Android y navegadores compatibles)
    const ensureThemeMeta = () => {
      const selector = 'meta[name="theme-color"]';
      let meta = document.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      // Light: blanco; Dark: gris muy oscuro
      meta.setAttribute("content", mode === "dark" ? "#111827" : "#ffffff");
    };
    try {
      ensureThemeMeta();
    } catch {
      // ignore meta update errors
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      // Sincronizar multi-pestaña: notificar el cambio explícitamente
      window.localStorage.setItem(`${THEME_STORAGE_KEY}_last_change`, String(Date.now()));
      // Log de depuración
      console.debug("[theme][provider] set theme =", mode, "html.dark?", root.classList.contains("dark"));
    } catch {
      // ignore
    }
  }, [mode]);

  // Escuchar cambios de tema realizados en otras pestañas y aplicarlos en vivo
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === THEME_STORAGE_KEY) {
        const newTheme = (e.newValue === "dark" ? "dark" : "light") as ThemeMode;
        console.debug("[theme][storage] detected change to", newTheme);
        setMode((prev) => (prev !== newTheme ? newTheme : prev));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = (t: ThemeMode) => setMode(t);

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Guardián opcional: detectar si algo externo manipula la clase 'dark' en <html> y reportarlo
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const hasDark = root.classList.contains("dark");
      const expected = mode === "dark";
      if (hasDark !== expected) {
        console.warn("[theme][observer] html.dark changed externally. expected:", expected, "got:", hasDark);
        // Reaplicar nuestro estado como fuente de verdad
        if (expected) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [mode]);

  const currentTheme = useMemo(() => {
    const themeForMode = mode === 'light' ? appTheme.light : appTheme.dark;
    return {
      ...appTheme,
      ...themeForMode,
    }
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      toggleTheme,
      setTheme,
      theme: currentTheme,
    }),
    [mode, currentTheme]
  );

  // Devolver con React.createElement para evitar problemas con configuración de JSX/erasableSyntaxOnly
  return React.createElement(ThemeContext.Provider, { value }, children);
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  }
  return ctx;
}
