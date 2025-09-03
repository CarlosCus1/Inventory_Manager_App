// --------------------------------------------------------------------------- #
//                                                                             #
//                    src/pages/InventarioPage.tsx                           #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { DataTable, type IColumn } from '../components/DataTable';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IProducto, IProductoEditado, FieldConfig } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { formatDecimal } from '../stringFormatters';

// --- 2. Definición del Componente de Página ---
export const InventarioPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.inventario);
  const lista = useAppStore((state) => state.listas.inventario);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);
  const eliminarProductoDeLista = useAppStore((state) => state.eliminarProductoDeLista);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);

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
    const totalCantidades = lista.reduce((sum, item) => sum + Number(item.cantidad), 0);
    const lineasUnicas = new Set(
      (lista || [])
        .map((it) => (it.linea ?? '').toString().trim().toUpperCase())
        .filter((v) => v.length > 0)
    );
    const totalLineas = lineasUnicas.size;
    return { totalCantidades, totalLineas };
  }, [lista]);

  // --- F. Lógica de Exportación a Excel ---
  const { addToast } = useToast(); // Initialize useToast

  const handleExport = async () => {
    if (!formState.documento_cliente || !formState.cliente || !formState.colaborador_personal) {
      addToast('Por favor, complete los campos obligatorios (Documento Cliente, Cliente, Colaborador/Personal) antes de descargar.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/export-xlsx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'inventario',
          form: formState,
          list: lista
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'inventario.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

      resetearModulo('inventario');

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      addToast("No se pudo generar el archivo de Excel. Verifique que el servidor backend esté funcionando.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- G. Renderizado del Componente ---
  const handleInputChange = useCallback((codigo: string, campo: keyof IProductoEditado, valor: string | number) => {
    actualizarProductoEnLista('inventario', codigo, campo, valor);
  }, [actualizarProductoEnLista]);

  const columns: IColumn<IProductoEditado>[] = useMemo(() => [
    { header: 'Código', accessor: 'codigo' },
    { header: 'Cod. EAN', accessor: 'cod_ean' },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Cantidad',
      accessor: 'cantidad',
      cellRenderer: (item) => (
        <input
          type="number"
          min={0}
          value={Number(item.cantidad) || 0}
          onChange={(e) => handleInputChange(item.codigo, 'cantidad', e.target.value)}
          className="input input-module-inventario w-24 text-right text-gray-900 dark:text-gray-100"
          aria-label={`Cantidad para ${item.nombre}`}
        />
      )
    },
    { header: 'Cant. por Caja', accessor: 'cantidad_por_caja', cellRenderer: (item) => <span>{formatDecimal(item.cantidad_por_caja ?? 0)}</span> },
    {
      header: 'Línea',
      accessor: 'linea',
      cellRenderer: (item) => (
        <input
          type="text"
          value={String(item.linea ?? '')}
          onChange={(e) => handleInputChange(item.codigo, 'linea', e.target.value)}
          className="input input-module-inventario w-40 text-gray-900 dark:text-gray-100"
          aria-label={`Línea para ${item.nombre}`}
        />
      )
    },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      cellRenderer: (item) => (
        <input
          type="text"
          value={String(item.observaciones ?? '')}
          onChange={(e) => handleInputChange(item.codigo, 'observaciones', e.target.value)}
          className="input input-module-inventario w-full text-gray-900 dark:text-gray-100"
          aria-label={`Observaciones para ${item.nombre}`}
        />
      )
    },
    {
      header: 'Acción',
      accessor: 'accion' as unknown as keyof IProductoEditado,
      cellRenderer: (item) => (
        <button
          onClick={() => eliminarProductoDeLista('inventario', item.codigo)}
          className="btn btn-module-inventario"
          aria-label={`Eliminar ${item.nombre}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
          </svg>
        </button>
      ),
    },
  ], [handleInputChange, eliminarProductoDeLista]);

  const fieldConfig: FieldConfig = {
    showRucDni: true,
    showCodigoCliente: true,
    showSucursal: true,
    showFecha: true,
    showColaborador: true,
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <PageHeader
        title="Control de Inventario"
        description="Realiza el conteo y actualización de existencias para mantener un inventario preciso y actualizado, con reportes que facilitan el análisis y toma de decisiones."
        themeColor="inventario"
      />

      <section className="section-card">
        <DatosGeneralesForm tipo="inventario" fieldConfig={fieldConfig} formState={formState} />
      </section>

      <section className="section-card">
        <h2 className="form-section-title title-inventario">Búsqueda y Selección</h2>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            aria-label="Buscar producto"
            placeholder="Buscar producto por código, EAN o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-module-inventario flex-1"
          />
          <LineSelectorModalTrigger
            moduloKey="inventario"
            buttonClassName="bg-inventario-light-primary dark:bg-inventario-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-inventario-light-primary dark:focus:ring-inventario-dark-primary ml-3"
            themeClass="title-inventario btn-module-inventario"
            onConfirm={(_, skipped) => {
              if (skipped.length > 0) {
                console.warn(`Se omitieron ${skipped.length} duplicados ya presentes en la lista.`);
              }
            }}
          />
          <button
            onClick={() => {
              const newProduct: IProducto = {
                codigo: searchTerm,
                nombre: searchTerm,
                cod_ean: '',
                peso: 0,
                stock_referencial: 0,
                linea: '',
                keywords: [],
              };
              agregarProductoToLista('inventario', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="bg-inventario-light-primary dark:bg-inventario-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-inventario-light-primary dark:focus:ring-inventario-dark-primary ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Añadir Manualmente
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="surface surface-border rounded-md max-h-60 overflow-y-auto">
            {searchResults.map((producto: IProducto) => (
              <li
                key={producto.codigo}
                onClick={() => {
                  // Add the product to the inventory list and clear the search term
                  agregarProductoToLista('inventario', producto);
                  setSearchTerm('');
                }}
                className="p-3 hover:opacity-90 cursor-pointer border-b border-[var(--border)]"
              >
                {producto.nombre} ({producto.codigo})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card">
        <h2 className="form-section-title title-inventario">Conteo de Inventario</h2>
        <DataTable
          data={lista}
          columns={columns}
        />
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-lg font-semibold">
            <span>Total Cantidades: <span className="font-extrabold title-inventario">{formatDecimal(totales.totalCantidades)}</span></span>
            <span className="ml-6">Total Líneas: <span className="font-extrabold title-inventario">{totales.totalLineas}</span></span>
          </div>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente || !formState.colaborador_personal}
            className="bg-inventario-light-primary dark:bg-inventario-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-inventario-light-primary dark:focus:ring-inventario-dark-primary mt-4 md:mt-0 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Generando...' : 'Descargar Inventario (XLSX)'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default InventarioPage;