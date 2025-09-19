import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable, type IColumn } from '../components/DataTable';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IProductoEditado, IProducto, FieldConfig } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { formatDecimal } from '../stringFormatters';
import { useAuth } from '../contexts/AuthContext';
import { exportXlsxApi } from '../utils/api';
import type { PedidoExport } from '../api/schemas';

// --- 2. Definición del Componente de Página ---
export const PedidoPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.pedido);
  const lista = useAppStore((state) => state.listas.pedido);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const actualizarProductoEnLista = useCallback((codigo: string, campo: keyof IProductoEditado, valor: string | number) => {
    useAppStore.getState().actualizarProductoEnLista('pedido', codigo, campo as any, valor);
  }, []);
  const eliminarProductoDeLista = useAppStore((state) => state.eliminarProductoDeLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- C. Carga inicial de datos ---
  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // --- D. Lógica de Búsqueda ---
  const searchResults = useSearch(catalogo, searchTerm);

  // --- E. Cálculos para los Totales ---
  const totales = useMemo(() => {
    const totalUnidades = lista.reduce((sum, item) => sum + Number(item.cantidad), 0);
    const totalPeso = lista.reduce((sum, item) => sum + (Number(item.peso) * Number(item.cantidad)), 0);
    return { totalUnidades, totalPeso };
  }, [lista]);

  // --- F. Definición de las Columnas para DataTable ---
  const columns = useMemo((): IColumn<IProductoEditado>[] => [
    { header: 'Código', accessor: 'codigo' },
    { header: 'Cod. EAN', accessor: 'cod_ean' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Cantidad',
      accessor: 'cantidad',
      cellRenderer: (item) => (
        <input
          type="number"
          aria-label={`Cantidad para ${item.nombre}`}
          placeholder="0"
          max={1000000}
          step={0.01}
          value={item.cantidad}
          onChange={(e) => actualizarProductoEnLista(item.codigo, 'cantidad', e.target.value)}
          className="input input-module-pedido input-qty w-28 md:w-32 text-gray-900 dark:text-gray-100"
        />
      )
    },
    { header: 'Precio Referencial', accessor: 'precio_referencial', cellRenderer: (item) => <span>{formatDecimal(item.precio_referencial ?? 0)} S/.</span> },
    { header: 'Cant. por Caja', accessor: 'cantidad_por_caja', cellRenderer: (item) => <span>{formatDecimal(item.cantidad_por_caja ?? 0)}</span> },
    { header: 'Stock Referencial', accessor: 'stock_referencial', cellRenderer: (item) => <span>{formatDecimal(item.stock_referencial ?? 0)}</span> },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      cellRenderer: (item) => (
        <input
          type="text"
          aria-label={`Observaciones para ${item.nombre}`}
          placeholder="Añadir observaciones"
          value={item.observaciones ?? ''}
          onChange={(e) => actualizarProductoEnLista(item.codigo, 'observaciones', e.target.value)}
          className="input input-module-pedido w-full text-gray-900 dark:text-gray-100"
        />
      )
    },
    {
      header: 'Acción',
      accessor: 'accion' as unknown as keyof IProductoEditado,
      cellRenderer: (item) => (
        <button
          onClick={() => eliminarProductoDeLista('pedido', item.codigo)}
          className="btn btn-module-pedido"
          aria-label={`Eliminar ${item.nombre}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
        </button>
      )
    }
  ], [eliminarProductoDeLista, actualizarProductoEnLista]);

  const { addToast } = useToast(); // Initialize useToast
  const { userName, userEmail } = useAuth();

  // --- G. Lógica de Exportación a Excel ---
  const handleExport = async () => {
    const errors: string[] = [];
    const formData = { ...formState };

    if (!formData.sucursal) {
      formData.sucursal = '[principal]';
    }

    if (!formData.documento_cliente || !formData.cliente) {
      errors.push('El Documento y Nombre del cliente son obligatorios.');
    }
    if (!formData.fecha) {
      errors.push('La Fecha es obligatoria.');
    }

    if (errors.length > 0) {
      errors.forEach(error => addToast(error, 'warning'));
      return;
    }

    // Ensure cantidad is number for all items
    const correctedLista = lista.map(item => ({
      ...item,
      cantidad: typeof item.cantidad === 'number' ? item.cantidad : parseInt(String(item.cantidad), 10) || 0
    }));

    setIsSubmitting(true);
    try {
      const payload: PedidoExport = {
        tipo: 'pedido',
        form: formData as any,
        list: correctedLista,
        usuario: {
          nombre: userName || '',
          correo: userEmail || ''
        }
      };
      const blob = await exportXlsxApi(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (blob as any).name || 'pedido.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

      resetearModulo('pedido');

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      addToast("No se pudo generar el archivo de Excel. Verifique que el servidor backend esté funcionando.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldConfig: FieldConfig = {
    showRucDni: true,
    showCodigoCliente: true,
    showSucursal: true,
    showFecha: true,
  };

  // --- H. Renderizado del Componente ---
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <PageHeader
        title="Pedidos & Disponibilidad"
        description="Crea y administra hojas de pedido con información actualizada de stock, sin incluir precios, para optimizar el seguimiento de requerimientos y disponibilidad de inventario."
        themeColor="pedido"
      />

      {/* Sección 1: Datos Generales */}
      <section className="section-card">
        <DatosGeneralesForm tipo="pedido" fieldConfig={fieldConfig} formState={formState} />
      </section>

      {/* Sección 2: Búsqueda y Selección de Productos */}
      <section className="section-card">
        <h2 className="form-section-title title-pedido">Búsqueda y Selección</h2>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar producto por código, EAN o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-module-pedido flex-1"
          />
          <LineSelectorModalTrigger
            moduloKey="pedido"
            showStockRef={true}
            buttonClassName="btn btn-module-pedido ml-3"
            onConfirm={(_, skipped) => {
              if (skipped.length > 0) {
                console.warn(`Se omitieron ${skipped.length} duplicados ya presentes en la lista (Pedido).`);
              }
            }}
          />
          <button
            onClick={() => {
              const newProduct: IProducto = {
                codigo: searchTerm,
                nombre: searchTerm,
                cod_ean: '',
                ean_14: '', // Added this line
                peso: 0,
                stock_referencial: 0,
                linea: '',
                keywords: [],
              };
              agregarProductoToLista('pedido', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn btn-module-pedido ml-3"
          >
            Añadir Manualmente
          </button>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente}
            className="btn btn-module-pedido ml-3"
          >
            {isSubmitting ? 'Generando...' : '▼ Reporte XLSX'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="surface surface-border rounded-md max-h-60 overflow-y-auto">
            {searchResults.map((producto: IProducto) => (
              <li 
                key={producto.codigo}
                onClick={() => { 
                  agregarProductoToLista('pedido', producto); 
                  setSearchTerm('');
                }}
                className="p-3 cursor-pointer border-b border-[var(--border-primary)] hover:bg-gray-100 dark:hover:bg-gray-800">
                {producto.nombre} ({producto.codigo}) - Stock: {formatDecimal(producto.stock_referencial)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sección 3: Reporte Final (Tabla de Productos) */}
      <section className="section-card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="form-section-title title-pedido mb-0">Hoja de Pedido</h2>
          <div className="text-lg font-semibold flex items-center gap-6 mt-4 md:mt-0">
            <span>Total Unidades: <span className="font-extrabold title-pedido">{formatDecimal(totales.totalUnidades)}</span></span>
            <span>Total Peso: <span className="font-extrabold title-pedido">{formatDecimal(totales.totalPeso)} kg</span></span>
          </div>
        </div>
        <DataTable 
          data={lista} 
          // Se usan columnas tipadas para DataTable
          columns={columns}
        />
      </section>
    </div>
  );
};