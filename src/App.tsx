// --------------------------------------------------------------------------- #
//                                                                             #
//                           src/App.tsx                                       #
//                                                                             #
// --------------------------------------------------------------------------- #

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <ToastContext.Provider value={{ addToast }}>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/devoluciones" element={<ProtectedRoute><DevolucionesPage /></ProtectedRoute>} />
            <Route path="/pedido" element={<ProtectedRoute><PedidoPage /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
            <Route path="/comparador" element={<ProtectedRoute><ComparadorPage /></ProtectedRoute>} />
          </Routes>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </Layout>
      </AuthProvider>
    </ToastContext.Provider>
  );
}

export default App;
