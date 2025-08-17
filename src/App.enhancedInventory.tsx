import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useAppStore } from './store/useAppStore';
import { mockRootProps } from './enhancedAppMockData';

// Mock page components for demonstration
const HomePage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Sistema de Gestión de Inventario Mejorado
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRootProps.moduleStats.map((module) => (
          <div key={module.name} className="card hover:scale-105 transition-transform duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: module.color }}
              />
              <h3 className="text-lg font-bold">{module.name}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uso actual:</span>
                <span className="font-mono">{module.usage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${module.usage}%`,
                    backgroundColor: module.color 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DevolucionesPage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="title-devoluciones text-2xl font-bold mb-6">Módulo de Devoluciones</h1>
      <p className="text-muted">Sistema de gestión de devoluciones con seguimiento en tiempo real.</p>
    </div>
  </div>
);

const PedidoPage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="title-pedido text-2xl font-bold mb-6">Módulo de Pedidos</h1>
      <p className="text-muted">Gestión completa de pedidos y órdenes de compra.</p>
    </div>
  </div>
);

const InventarioPage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="title-inventario text-2xl font-bold mb-6">Módulo de Inventario</h1>
      <p className="text-muted">Control de stock y gestión de inventario en tiempo real.</p>
    </div>
  </div>
);

const ComparadorPage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="title-comparador text-2xl font-bold mb-6">Módulo Comparador</h1>
      <p className="text-muted">Comparación de precios y análisis de competencia.</p>
    </div>
  </div>
);

const PlanificadorPage: React.FC = () => (
  <div className="container-compact section-compact">
    <div className="section-card">
      <h1 className="title-planificador text-2xl font-bold mb-6">Módulo Planificador</h1>
      <p className="text-muted">Planificación y programación de actividades.</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const theme = useAppStore((state) => state.theme);

  React.useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devoluciones" element={<DevolucionesPage />} />
          <Route path="/pedido" element={<PedidoPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/comparador" element={<ComparadorPage />} />
          <Route path="/planificador" element={<PlanificadorPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;