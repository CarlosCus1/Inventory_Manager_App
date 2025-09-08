import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Button, Input, Card, FormGroup, Container, ModuleDebugger, Modal, Select, Checkbox, DataTable, SearchInput } from './components/ui';
import { LineSelectorModalTrigger } from './components/LineSelectorModal';
import { ModuleType } from './enums';

// Componente de demostración del sistema de diseño mejorado
const DesignSystemDemo: React.FC = () => {
  const [inputValues, setInputValues] = React.useState({
    email: '',
    password: '',
    search: '',
    amount: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Container size="xl" padding="lg">
        {/* Header */}
        <header className="text-center mb-16 fade-in">
          <div className="surface-glass max-w-5xl mx-auto p-8 rounded-3xl">
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Sistema de Diseño Mejorado
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4">
              Inventory Manager App - Con transparencias y padding mejorado
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                Transparencias 30%
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                Padding Mejorado
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                Glassmorphism
              </span>
            </div>
          </div>
        </header>

        {/* Inputs Mejorados */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-10 text-center">Inputs con Transparencias y Padding Mejorado</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs por Módulo */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-center mb-6">Inputs por Módulo</h3>
              
              <div className="module-devoluciones space-y-6 p-6 surface-card">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--module-primary)' }}>Devoluciones - Rojo</h4>
                <Input
                  module={ModuleType.DEVOLUCIONES}
                  label="Email (Devoluciones)"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inputValues.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                  helpText="Ingresa tu email para el módulo de devoluciones"
                />
              </div>

              <div className="module-pedido space-y-6 p-6 surface-card">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--module-primary)' }}>Pedidos - Azul</h4>
                <Input
                  module={ModuleType.PEDIDO}
                  label="Contraseña (Pedidos)"
                  type="password"
                  placeholder="••••••••"
                  value={inputValues.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  required
                />
              </div>

              <div className="module-inventario space-y-6 p-6 surface-card">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--module-primary)' }}>Inventario - Verde</h4>
                <Input
                  module={ModuleType.INVENTARIO}
                  label="Búsqueda (Inventario)"
                  placeholder="Buscar productos..."
                  value={inputValues.search}
                  onChange={(e) => handleInputChange('search', e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                  rightIcon={
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }
                />
              </div>

              <div className="module-comparador space-y-6 p-6 surface-card">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--module-primary)' }}>Comparador - Naranja</h4>
                <Input
                  module={ModuleType.COMPARADOR}
                  label="Monto (Comparador)"
                  type="number"
                  placeholder="0.00"
                  value={inputValues.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  leftIcon={<span>S/.</span>}
                  helpText="Ingresa el monto para comparación"
                />
              </div>
            </div>

            {/* Variantes y Tamaños */}
            <FormGroup 
              title="Variantes y Tamaños" 
              description="Diferentes estilos y tamaños de inputs"
              spacing="lg"
            >
              <Input
                label="Input Pequeño"
                size="sm"
                placeholder="Tamaño pequeño"
                helpText="Input con tamaño reducido"
              />

              <Input
                label="Input Normal"
                size="md"
                placeholder="Tamaño normal"
                variant="default"
              />

              <Input
                label="Input Grande"
                size="lg"
                placeholder="Tamaño grande"
                variant="glass"
                helpText="Input con efecto glass"
              />

              <Input
                label="Input con Error"
                placeholder="Campo con error"
                error="Este campo es obligatorio"
                required
              />
            </FormGroup>
          </div>
        </section>

        {/* Módulos con Cards Mejoradas */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-10 text-center">Cards con Transparencias por Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Devoluciones */}
            <Card module={ModuleType.DEVOLUCIONES} title="Devoluciones" hover variant="glass" className="module-devoluciones">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl surface-glass flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--module-primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Módulo activo</p>
                    <p className="font-semibold" style={{ color: 'var(--module-primary)' }}>Logística Inversa</p>
                  </div>
                </div>
                <Button module={ModuleType.DEVOLUCIONES} variant="primary" fullWidth>
                  Gestionar Devoluciones
                </Button>
                <Button module={ModuleType.DEVOLUCIONES} variant="outline" fullWidth>
                  Ver Reportes
                </Button>
              </div>
            </Card>

            {/* Pedidos */}
            <Card module={ModuleType.PEDIDO} title="Pedidos" hover variant="glass" className="module-pedido">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl surface-glass flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--module-primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Módulo activo</p>
                    <p className="font-semibold" style={{ color: 'var(--module-primary)' }}>Gestión de Pedidos</p>
                  </div>
                </div>
                <Button module={ModuleType.PEDIDO} variant="primary" fullWidth>
                  Crear Pedido
                </Button>
                <Button module={ModuleType.PEDIDO} variant="outline" fullWidth>
                  Ver Historial
                </Button>
              </div>
            </Card>

            {/* Inventario */}
            <Card module={ModuleType.INVENTARIO} title="Inventario" hover variant="glass" className="module-inventario">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl surface-glass flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--module-primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Módulo activo</p>
                    <p className="font-semibold" style={{ color: 'var(--module-primary)' }}>Control de Stock</p>
                  </div>
                </div>
                <Button module={ModuleType.INVENTARIO} variant="primary" fullWidth>
                  Contar Inventario
                </Button>
                <Button module={ModuleType.INVENTARIO} variant="outline" fullWidth>
                  Ver Stock
                </Button>
              </div>
            </Card>

            {/* Comparador */}
            <Card module={ModuleType.COMPARADOR} title="Comparador" hover variant="glass" className="module-comparador">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl surface-glass flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--module-primary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Módulo activo</p>
                    <p className="font-semibold" style={{ color: 'var(--module-primary)' }}>Análisis de Precios</p>
                  </div>
                </div>
                <Button module={ModuleType.COMPARADOR} variant="primary" fullWidth>
                  Comparar Precios
                </Button>
                <Button module={ModuleType.COMPARADOR} variant="outline" fullWidth>
                  Ver Análisis
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Debug de Módulos */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-10 text-center">Debug de Variables CSS por Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ModuleDebugger module={ModuleType.DEVOLUCIONES} title="Devoluciones" />
            <ModuleDebugger module={ModuleType.PEDIDO} title="Pedidos" />
            <ModuleDebugger module={ModuleType.INVENTARIO} title="Inventario" />
            <ModuleDebugger module={ModuleType.COMPARADOR} title="Comparador" />
          </div>
        </section>

        {/* Demostración de Transparencias */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-10 text-center">Efectos de Transparencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="default" title="Card Normal" className="relative overflow-hidden">
              <p className="mb-4">Card con fondo sólido tradicional.</p>
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full -mr-10 -mt-10"></div>
            </Card>
            
            <Card variant="glass" title="Card Glass" className="relative overflow-hidden">
              <p className="mb-4">Card con efecto glassmorphism y transparencia del 30%.</p>
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-20 rounded-full -mr-10 -mt-10"></div>
            </Card>
            
            <Card variant="elevated" title="Card Elevada" className="relative overflow-hidden">
              <p className="mb-4">Card elevada con sombras mejoradas y transparencias.</p>
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-15 rounded-full -mr-10 -mt-10"></div>
            </Card>
          </div>
        </section>

        {/* Modal de Selección Múltiple Mejorado */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-10 text-center">Modal de Selección Múltiple Mejorado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Modales por cada módulo */}
            <Card title="Devoluciones" module={ModuleType.DEVOLUCIONES} className="module-devoluciones">
              <p className="text-sm mb-4 opacity-80">Modal con selección múltiple para devoluciones</p>
              <LineSelectorModalTrigger
                moduloKey="devoluciones"
                showStockRef={false}
                onConfirm={(added, skipped) => {
                  console.log('Devoluciones - Agregados:', added.length, 'Omitidos:', skipped.length);
                }}
              />
            </Card>

            <Card title="Pedidos" module={ModuleType.PEDIDO} className="module-pedido">
              <p className="text-sm mb-4 opacity-80">Modal con información de stock para pedidos</p>
              <LineSelectorModalTrigger
                moduloKey="pedido"
                showStockRef={true}
                onConfirm={(added, skipped) => {
                  console.log('Pedidos - Agregados:', added.length, 'Omitidos:', skipped.length);
                }}
              />
            </Card>

            <Card title="Inventario" module={ModuleType.INVENTARIO} className="module-inventario">
              <p className="text-sm mb-4 opacity-80">Modal para selección de inventario</p>
              <LineSelectorModalTrigger
                moduloKey="inventario"
                showStockRef={false}
                onConfirm={(added, skipped) => {
                  console.log('Inventario - Agregados:', added.length, 'Omitidos:', skipped.length);
                }}
              />
            </Card>

            <Card title="Comparador" module={ModuleType.COMPARADOR} className="module-comparador">
              <p className="text-sm mb-4 opacity-80">Modal para comparación de precios</p>
              <LineSelectorModalTrigger
                moduloKey="comparador"
                showStockRef={true}
                onConfirm={(added, skipped) => {
                  console.log('Comparador - Agregados:', added.length, 'Omitidos:', skipped.length);
                }}
              />
            </Card>
          </div>

          <div className="mt-8 p-6 surface-glass rounded-2xl">
            <h3 className="text-xl font-bold mb-4">🔧 Mejoras del Modal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✨ Componentes Modulares</h4>
                <ul className="space-y-1 opacity-80">
                  <li>• Modal base reutilizable</li>
                  <li>• DataTable con selección múltiple</li>
                  <li>• SearchInput con botón de limpiar</li>
                  <li>• Select estilizado por módulo</li>
                  <li>• Checkbox personalizado</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 Mejoras de UX</h4>
                <ul className="space-y-1 opacity-80">
                  <li>• Manejo de focus y accesibilidad</li>
                  <li>• Escape key para cerrar</li>
                  <li>• Backdrop blur con transparencias</li>
                  <li>• Estados de carga y error</li>
                  <li>• Contador de seleccionados</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-12">
          <div className="surface-glass rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">✅ Modal de Selección Múltiple Revisado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🧩</span>
                </div>
                <p className="font-semibold">Componentes Modulares</p>
                <p className="opacity-80">Código organizado y reutilizable</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">♿</span>
                </div>
                <p className="font-semibold">Accesibilidad</p>
                <p className="opacity-80">ARIA labels y manejo de focus</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <p className="font-semibold">Diseño Consistente</p>
                <p className="opacity-80">Integrado con el sistema de diseño</p>
              </div>
            </div>
          </div>
        </footer>
      </Container>
    </div>
  );
};

// App principal para preview
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DesignSystemDemo />
    </BrowserRouter>
  );
};

export default App;