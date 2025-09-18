// --------------------------------------------------------------------------- #
//                                                                             #
//                           src/App.tsx                                       #
//                                                                             #
// --------------------------------------------------------------------------- #

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { DevolucionesPage } from './pages/DevolucionesPage';
import { PedidoPage } from './pages/PedidoPage';
import { InventarioPage } from './pages/InventarioPage';
import { ComparadorPage } from './pages/ComparadorPage';
import { useToasts } from './hooks/useToasts';
import ToastContainer from './components/ui/ToastContainer';
import { ToastContext } from './contexts/ToastContext';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAppStore } from './store/useAppStore';
import theme from './theme/muiTheme';

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Theme wrapper component
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentTheme = useAppStore((state) => state.theme);

  // Apply dark class to document.documentElement for CSS dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  const muiTheme = createTheme(
    theme(currentTheme)
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function App() {
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <ToastContext.Provider value={{ addToast }}>
      <AuthProvider>
        <ThemeWrapper>
          <Layout>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/devoluciones" element={<ProtectedRoute><DevolucionesPage /></ProtectedRoute>} />
              <Route path="/pedido" element={<ProtectedRoute><PedidoPage /></ProtectedRoute>} />
              <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
              <Route path="/comparador" element={<ProtectedRoute><ComparadorPage /></ProtectedRoute>} />
            </Routes>
            <ToastContainer toasts={toasts} onClose={removeToast} />
          </Layout>
        </ThemeWrapper>
      </AuthProvider>
    </ToastContext.Provider>
  );
}

export default App;
