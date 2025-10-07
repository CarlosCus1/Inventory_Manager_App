import React, { useState, useEffect, useMemo } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { DataTable, type IColumn } from '../components/DataTable';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IProducto, FieldConfig, IForm } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/auth';
import { formatDecimal } from '../stringFormatters';
import { exportXlsxApi } from '../utils/api';
import type { DevolucionesExport, ProductoEditado } from '../api/schemas';

// Tipo local para manejar el nombre del archivo en el blob de respuesta
type BlobWithName = Blob & { name?: string };

// --- 2. Definición del Componente de Página --- 
export const DevolucionesPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand --- 
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.devoluciones);
  const lista = useAppStore((state) => state.listas.devoluciones);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);
  const eliminarProductoDeLista = useAppStore((state) => state.eliminarProductoDeLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);

  // --- B. Estado Local del Componente --- 
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- C. Datos del usuario --- 
  const { userName, userEmail } = useAuth();

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
  const columns = useMemo((): IColumn<ProductoEditado>[] => [
    { header: 'Código', accessor: 'codigo' },
    { header: 'Cod. EAN', accessor: 'cod_ean' },
    { header: 'Nombre', accessor: 'nombre' },
    {
      header: 'Cantidad',
      accessor: 'cantidad',
      cellRenderer: (item) => (
        <input
          type="number"
          aria-label={`Cantidad para ${item.nombre}`}
          placeholder="0"
          max={1000000}
          step={0.01}
          value={item.cantidad}
          onChange={(e) => actualizarProductoEnLista('devoluciones', item.codigo, 'cantidad', Number(e.target.value))}
          className="input input-module-devoluciones input-qty w-28 md:w-32 text-gray-900 dark:text-gray-100"
        />
      )
    },
    { header: 'Cant. por Caja', accessor: 'cantidad_por_caja', cellRenderer: (item) => <span>{formatDecimal(item.cantidad_por_caja ?? 0)}</span> },
    { header: 'Peso', accessor: 'peso', cellRenderer: (item) => <span>{formatDecimal(item.peso)}</span> },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      cellRenderer: (item) => (
        <input
          type="text"
          aria-label={`Observaciones para ${item.nombre}`}
          placeholder="Añadir observaciones"
          value={item.observaciones ?? ''}
          onChange={(e) => actualizarProductoEnLista('devoluciones', item.codigo, 'observaciones', e.target.value)}
          className="input input-module-devoluciones w-full text-gray-900 dark:text-gray-100"
        />
      )
    },
    {
      header: 'Acción',
      accessor: 'accion' as unknown as keyof ProductoEditado, // accessor tipado para cumplir firma
      cellRenderer: (item) => (
        <button
          onClick={() => eliminarProductoDeLista('devoluciones', item.codigo)}
          className="btn btn-module-devoluciones"
          aria-label={`Eliminar ${item.nombre}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
        </button>
      )
    }
  ], [eliminarProductoDeLista, actualizarProductoEnLista]);

  const { addToast } = useToast(); // Initialize useToast

  // --- G. Lógica de Exportación a Excel --- 
  const handleExport = async () => {
    const errors: string[] = [];
    const formData = { ...formState } as IForm & { motivo?: string };

    if (!formData.sucursal) {
      formData.sucursal = '[principal]';
    }

    if (!formData.documento_cliente || !formData.cliente) {
      errors.push('El Documento y Nombre del cliente son obligatorios.');
    }
    if (!formData.motivo) {
      errors.push('El Motivo de devolución es obligatorio.');
    }
    if (!formData.fecha) {
      errors.push('La Fecha es obligatoria.');
    }

    if (errors.length > 0) {
      errors.forEach(error => addToast(error, 'warning'));
      return;
    }

    const validFormData = {
      ...formData,
      motivo: formData.motivo!,
  };

    setIsSubmitting(true);
    try {
      const payload: DevolucionesExport = {
        tipo: 'devoluciones',
        form: validFormData,
        list: lista.map(item => {
          const newItem: Partial<ProductoEditado> & { u_por_caja?: unknown } = { ...item };
          
          if (typeof newItem.u_por_caja === 'number') {
            newItem.cantidad_por_caja = newItem.u_por_caja;
            delete newItem.u_por_caja;
          }

          if (newItem.cantidad_por_caja !== null && newItem.cantidad_por_caja !== undefined) {
            newItem.cantidad_por_caja = Math.floor(Number(newItem.cantidad_por_caja));
          }

          newItem.peso = typeof newItem.peso === 'number' ? newItem.peso : 0;
          newItem.precio_referencial = typeof newItem.precio_referencial === 'number' ? newItem.precio_referencial : 0;
          newItem.cod_ean = newItem.cod_ean || 'N/A';
          newItem.ean_14 = newItem.ean_14 || 'N/A';
          if (!Array.isArray(newItem.keywords)) {
            newItem.keywords = [];
          }
          newItem.cantidad = Math.floor(Number(newItem.cantidad));

          return newItem as ProductoEditado;
        }),
        usuario: {
          nombre: userName || '',
          correo: userEmail || ''
        }
      };
      const blob: BlobWithName = await exportXlsxApi(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = blob.name || 'devoluciones.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

      resetearModulo('devoluciones');
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
    showMotivo: true,
  };

  // --- H. Renderizado del Componente --- 
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 decorative-bg-radial">
        <div className="h-full w-full opacity-60 blur-3xl" />
      </div>
      <PageHeader
        title="Devoluciones & Logística Inversa"
        description="Gestiona y controla las devoluciones de productos, registrando motivos y estados para facilitar el proceso de logística inversa y generación de reportes detallados."
        themeColor="devoluciones"
      />

      <section className="section-card">
        <DatosGeneralesForm tipo="devoluciones" formState={formState} fieldConfig={fieldConfig} />
      </section>

      <section className="section-card">
        <h2 className="form-section-title title-devoluciones">Búsqueda y Selección</h2>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            aria-label="Buscar producto"
            placeholder="Buscar producto por código, EAN o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-module-devoluciones flex-1"
          />
          <LineSelectorModalTrigger
            moduloKey="devoluciones"
            showStockRef={false}
            buttonClassName="btn btn-module-devoluciones ml-3"
            onConfirm={(_, skipped) => {
              if (skipped.length > 0) {
                console.warn(`Se omitieron ${skipped.length} duplicados ya presentes en la lista (Devoluciones).`);
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
              agregarProductoToLista('devoluciones', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn btn-module-devoluciones ml-3"
          >
            Añadir Manualmente
          </button>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente || !(formState as any).motivo}
            className="btn btn-module-devoluciones ml-3"
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
                  agregarProductoToLista('devoluciones', producto);
                  setSearchTerm(''); // Limpiar búsqueda después de agregar
                }}
                className="p-3 cursor-pointer border-b border-[var(--border-primary)] hover:bg-gray-100 dark:hover:bg-gray-800">
                {producto.nombre} ({producto.codigo})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="form-section-title title-devoluciones mb-0">Reporte Final</h2>
          <div className="text-lg font-semibold flex items-center gap-6 mt-4 md:mt-0">
            <span>Total Unidades: <span className="font-extrabold title-devoluciones">{formatDecimal(totales.totalUnidades)}</span></span>
            <span>Total Peso: <span className="font-extrabold title-devoluciones">{formatDecimal(totales.totalPeso)} kg</span></span>
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
