// --------------------------------------------------------------------------- #
//                                                                             #
//                           src/App.tsx                                       #
//                                                                             #
// --------------------------------------------------------------------------- #

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { DevolucionesPage } from './pages/DevolucionesPage';
import { PedidoPage } from './pages/PedidoPage';
import { InventarioPage } from './pages/InventarioPage';
import { ComparadorPage } from './pages/ComparadorPage';
import { PlanificadorPage } from './pages/PlanificadorPage';
import { useToasts } from './hooks/useToasts';
import ToastContainer from './components/ui/ToastContainer';
import { ToastContext } from './contexts/ToastContext';

function App() {
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <ToastContext.Provider value={{ addToast }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/devoluciones" element={<DevolucionesPage />} />
          <Route path="/pedido" element={<PedidoPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/comparador" element={<ComparadorPage />} />
          <Route path="/planificador" element={<PlanificadorPage />} />
        </Routes>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </Layout>
    </ToastContext.Provider>
  );
}

export default App;
