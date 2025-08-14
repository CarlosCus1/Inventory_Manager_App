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
import type { IForm, IProducto } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { FormGroup, Label } from '../components/ui/FormControls';
import { StyledInput } from '../components/ui/StyledInput';
// Removed unused import

// --- 2. Definición del Componente de Página ---
export const InventarioPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.inventario);
  const lista = useAppStore((state) => state.listas.inventario);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed unused state variable

  // --- C. Carga inicial de datos ---
  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // --- D. Lógica de Búsqueda ---
  const searchResults = useSearch(catalogo, searchTerm);

  // --- E. Cálculos para los Totales ---
  const totales = useMemo(() => {
    const totalCantidades = lista.reduce((sum, item) => sum + Number(item.cantidad), 0);
    // Contar líneas únicas normalizando a mayúsculas y recortando espacios
    const lineasUnicas = new Set(
      (lista || [])
        .map((it) => (it.linea ?? '').toString().trim().toUpperCase())
        .filter((v) => v.length > 0)
    );
    const totalLineas = lineasUnicas.size;
    return { totalCantidades, totalLineas };
  }, [lista]);

  // --- F. Lógica de Exportación a Excel ---
  const handleExport = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/export-xlsx', {
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
      alert("No se pudo generar el archivo de Excel. Verifique que el servidor backend esté funcionando.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- G. Renderizado del Componente ---
  // Columnas para DataTable tipadas
  type RowInv = {
    codigo: string;
    cod_ean: string;
    nombre: string;
    cantidad: number;
    linea?: string;
    observaciones?: string;
  };

  const handleCantidadChange = useCallback((codigo: string, valor: string) => {
    const num = Number(valor);
    if (Number.isNaN(num) || num < 0) return;
    actualizarProductoEnLista('inventario', codigo, 'cantidad', num as unknown as RowInv['cantidad']);
  }, [actualizarProductoEnLista]);

  // Handler para los campos del formulario de datos generales
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    actualizarFormulario('inventario', name as keyof IForm, value);
  };

  const columns: IColumn<RowInv>[] = [
    { header: 'Código', accessor: 'codigo' },
    { header: 'Cod. EAN', accessor: 'cod_ean' },
    { header: 'Nombre', accessor: 'nombre' },
    {
      header: 'Cantidad',
      accessor: 'cantidad',
      cellRenderer: (item: RowInv) => (
        <input
          type="number"
          min={0}
          value={Number(item.cantidad) || 0}
          onChange={(e) => handleCantidadChange(item.codigo, e.target.value)}
          className="input input-module-inventario w-24 text-right"
          aria-label="Cantidad" // Added aria-label
        />
      )
    },
    {
      header: 'Línea',
      accessor: 'linea',
      cellRenderer: (item: RowInv) => (
        <input
          type="text"
          value={String(item.linea ?? '')}
          onChange={(e) => actualizarProductoEnLista('inventario', item.codigo, 'linea', e.target.value)}
          className="input input-module-inventario w-40"
          aria-label="Línea" // Added aria-label
        />
      )
    },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      cellRenderer: (item: RowInv) => (
        <input
          type="text"
          value={String(item.observaciones ?? '')}
          onChange={(e) => actualizarProductoEnLista('inventario', item.codigo, 'observaciones', e.target.value)}
          className="input input-module-inventario w-full"
          aria-label="Observaciones" // Added aria-label
        />
      )
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <PageHeader
        title="Control de Inventario"
        description="Realiza el conteo y actualización de existencias para mantener un inventario preciso y actualizado, con reportes que facilitan el análisis y toma de decisiones."
        themeColor="inventario"
      />

      <section className="section-card">
        <DatosGeneralesForm tipo="inventario">
          {/* Campos específicos para Inventario */}
          <FormGroup>
            <Label htmlFor="colaborador_personal">Colaborador / Personal</Label>
            <StyledInput
              type="text"
              id="colaborador_personal"
              name="colaborador_personal"
              value={formState.colaborador_personal || ''}
              onChange={handleFormChange}
              placeholder="Nombre del colaborador"
              variant="inventario"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="fecha">Fecha</Label>
            <StyledInput
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleFormChange}
              variant="inventario"
            />
          </FormGroup>
        </DatosGeneralesForm>
      </section>

      <section className="section-card">
        <h2 className="text-2xl font-bold mb-4 title-inventario">Búsqueda y Selección</h2>
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
            buttonClassName="btn-module-inventario ml-3"
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
            className="btn-module-inventario ml-3"
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
        <h2 className="text-2xl font-bold mb-4 title-inventario">Conteo de Inventario</h2>
        <DataTable
          data={lista as unknown as RowInv[]}
          columns={columns}
        />
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-lg font-semibold">
            <span>Total Cantidades: <span className="font-extrabold title-inventario">{totales.totalCantidades}</span></span>
            <span className="ml-6">Total Líneas: <span className="font-extrabold title-inventario">{totales.totalLineas}</span></span>
          </div>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente || !formState.colaborador_personal}
            className="btn-module-inventario mt-4 md:mt-0 w-full md:w-auto"
          >
            {isSubmitting ? 'Generando...' : 'Descargar Inventario (XLSX)'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default InventarioPage;
