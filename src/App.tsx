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

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/devoluciones" element={<DevolucionesPage />} />
        <Route path="/pedido" element={<PedidoPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/comparador" element={<ComparadorPage />} />
        <Route path="/planificador" element={<PlanificadorPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
