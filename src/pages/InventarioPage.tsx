import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable, type IColumn } from '../components/DataTable';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { FieldConfig, IProducto } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { formatDecimal } from '../stringFormatters';
import { exportXlsxApi } from '../utils/api';
import type { InventarioExport, ProductoEditado } from '../api/schemas';
import { useAuth } from '../contexts/AuthContext';

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
  const actualizarProductoEnLista = useCallback((codigo: string, campo: keyof ProductoEditado, valor: string | number) => {
    useAppStore.getState().actualizarProductoEnLista('inventario', codigo, campo as any, valor);
  }, []);

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
  const { userName, userEmail } = useAuth();

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

    setIsSubmitting(true);
    try {
      // Transformación final antes de enviar
      const payload: InventarioExport = {
        tipo: 'inventario',
        form: {
          ...formData,
          fecha: formData.fecha ? new Date(formData.fecha).toISOString() : new Date().toISOString(),
        },
        list: lista.map(item => ({
          ...item,
          cantidad: Math.floor(Number(item.cantidad)), // Forzar entero
          ean_14: item.ean_14 || '', // Asegurar campo requerido
          precio_referencial: typeof item.precio_referencial === 'number' ? item.precio_referencial : undefined,
        })),
        usuario: {
          nombre: userName || 'Usuario Desconocido',
          correo: userEmail?.includes('@') ? userEmail : 'correo@invalido.com'
        },
        
      };
      console.log('Payload para inventario:', JSON.stringify(payload, null, 2));
      const blob = await exportXlsxApi(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (blob as unknown as { name?: string }).name || 'inventario.xlsx';
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
  const columns: IColumn<ProductoEditado>[] = useMemo(() => [
    { header: 'Código', accessor: 'codigo' },
    { header: 'Cod. EAN', accessor: 'cod_ean' },
    { header: 'Nombre', accessor: 'nombre' },
    {
      header: 'Cantidad',
      accessor: 'cantidad',
      cellRenderer: (item) => (
        <input
          type="number"
          min={0}
          max={1000000}
          step={0.01}
          value={item.cantidad}
          onChange={(e) => {
            const value = e.target.value.trim() === '' ? 0 : Number(e.target.value);
            actualizarProductoEnLista(item.codigo, 'cantidad', value);
          }}
          className="input input-module-inventario input-qty w-32 text-right text-gray-900 dark:text-gray-100"
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
          onChange={(e) => actualizarProductoEnLista(item.codigo, 'linea', e.target.value)}
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
          onChange={(e) => actualizarProductoEnLista(item.codigo, 'observaciones', e.target.value)}
          className="input input-module-inventario w-full text-gray-900 dark:text-gray-100"
          aria-label={`Observaciones para ${item.nombre}`}
        />
      )
    },
    {
      header: 'Acción',
      accessor: 'accion' as unknown as keyof ProductoEditado,
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
  ], [eliminarProductoDeLista, actualizarProductoEnLista]);

  const fieldConfig: FieldConfig = {
    showRucDni: true,
    showCodigoCliente: true,
    showSucursal: true,
    showFecha: true,

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
            buttonClassName="btn btn-module-inventario ml-3"
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
                ean_14: '',
                peso: 0,
                stock_referencial: 0,
                linea: '',
                keywords: [],
              };
              agregarProductoToLista('inventario', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn btn-module-inventario ml-3"
          >
            Añadir Manualmente
          </button>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente}
            className="btn btn-module-inventario ml-3"
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
                  // Add the product to the inventory list and clear the search term
                  agregarProductoToLista('inventario', producto);
                  setSearchTerm('');
                }}
                className="p-3 cursor-pointer border-b border-[var(--border-primary)] hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {producto.nombre} ({producto.codigo})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="form-section-title title-inventario mb-0">Conteo de Inventario</h2>
          <div className="text-lg font-semibold flex items-center gap-6 mt-4 md:mt-0">
            <span>Total Cantidades: <span className="font-extrabold title-inventario">{formatDecimal(totales.totalCantidades)}</span></span>
            <span>Total Líneas: <span className="font-extrabold title-inventario">{totales.totalLineas}</span></span>
          </div>
        </div>
        <DataTable
          data={lista}
          columns={columns}
        />
      </section>
    </div>
  );
};

export default InventarioPage;
