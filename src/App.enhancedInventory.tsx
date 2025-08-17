import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppStore } from './store/useAppStore';

const HomePage = lazy(() => import('./pages/Home').then(module => ({ default: module.default })));
const DevolucionesPage = lazy(() => import('./pages/DevolucionesPage').then(module => ({ default: module.DevolucionesPage })));
const PedidoPage = lazy(() => import('./pages/PedidoPage').then(module => ({ default: module.PedidoPage })));
const InventarioPage = lazy(() => import('./pages/InventarioPage').then(module => ({ default: module.InventarioPage })));
const ComparadorPage = lazy(() => import('./pages/ComparadorPage').then(module => ({ default: module.ComparadorPage })));
const PlanificadorPage = lazy(() => import('./pages/PlanificadorPage').then(module => ({ default: module.PlanificadorPage })));


const App: React.FC = () => {
  const theme = useAppStore((state) => state.theme);

  React.useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/devoluciones" element={<DevolucionesPage />} />
            <Route path="/pedido" element={<PedidoPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/comparador" element={<ComparadorPage />} />
            <Route path="/planificador" element={<PlanificadorPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
