
// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/pages/PedidoPage.tsx                              #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { DataTable, type IColumn } from '../components/DataTable';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import { useFormChangeHandler } from '../hooks/useFormChangeHandler';
import type { IProducto, IProductoEditado } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { FormGroup, Label } from '../components/ui/FormControls';
import { StyledInput } from '../components/ui/StyledInput';

// --- 2. Definición del Componente de Página ---
export const PedidoPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  // Reutilizamos la misma lógica que en Devoluciones, pero apuntando al estado de 'pedido'.
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.pedido);
  const lista = useAppStore((state) => state.listas.pedido);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);
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
    return { totalUnidades, totalPeso: totalPeso.toFixed(2) };
  }, [lista]);

  // --- F. Definición de las Columnas para DataTable ---
  const handleInputChange = useCallback((codigo: string, campo: keyof IProductoEditado, valor: string | number) => {
    const valorFinal = campo === 'cantidad' ? Number(valor) : valor;
    actualizarProductoEnLista('pedido', codigo, campo, valorFinal);
  }, [actualizarProductoEnLista]);

  // Handler para los campos del formulario de datos generales
  const handleFormChange = useFormChangeHandler('pedido');

  const columns = useMemo((): IColumn<IProductoEditado>[] => [
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
          value={item.cantidad}
          onChange={(e) => handleInputChange(item.codigo, 'cantidad', e.target.value)}
          className="input-module-pedido w-full"
        />
      )
    },
    { header: 'Stock Referencial', accessor: 'stock_referencial' },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
      cellRenderer: (item) => (
        <input
          type="text"
          aria-label={`Observaciones para ${item.nombre}`}
          placeholder="Añadir observaciones"
          value={item.observaciones ?? ''}
          onChange={(e) => handleInputChange(item.codigo, 'observaciones', e.target.value)}
          className="input-module-pedido w-full"
        />
      )
    },
    {
      header: 'Acción',
      accessor: 'accion' as unknown as keyof IProductoEditado,
      cellRenderer: (item) => (
        <button
          onClick={() => eliminarProductoDeLista('pedido', item.codigo)}
          className="btn-outline-pedido"
          aria-label={`Eliminar ${item.nombre}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
        </button>
      )
    }
  ], [handleInputChange, eliminarProductoDeLista]);

  // --- G. Lógica de Exportación a Excel ---
  const handleExport = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/export-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // La única diferencia clave para el backend es el `tipo`.
        body: JSON.stringify({ 
          tipo: 'pedido', 
          form: formState, 
          list: lista 
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'pedido.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

      resetearModulo('pedido');

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("No se pudo generar el archivo de Excel. Verifique que el servidor backend esté funcionando.");
    } finally {
      setIsSubmitting(false);
    }
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
        <DatosGeneralesForm tipo="pedido">
          {/* Campos específicos para Pedido */}
          <FormGroup>
            <Label htmlFor="fecha">Fecha</Label>
            <StyledInput
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleFormChange}
              variant="pedido"
            />
          </FormGroup>
        </DatosGeneralesForm>
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
            buttonClassName="btn-module-pedido ml-3"
            themeClass="title-pedido btn-module-pedido"
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
                peso: 0,
                stock_referencial: 0,
                linea: '',
                keywords: [],
              };
              agregarProductoToLista('pedido', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn-module-pedido ml-3"
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
                  agregarProductoToLista('pedido', producto); 
                  setSearchTerm('');
                }}
                className="p-3 hover:opacity-90 cursor-pointer border-b border-[var(--border)]">
                {producto.nombre} ({producto.codigo}) - Stock: {producto.stock_referencial}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sección 3: Reporte Final (Tabla de Productos) */}
      <section className="section-card">
        <h2 className="form-section-title title-pedido">Hoja de Pedido</h2>
        <DataTable 
          data={lista} 
          // Se usan columnas tipadas para DataTable
          columns={columns}
        />
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-lg font-semibold">
            <span>Total Unidades: <span className="font-extrabold title-pedido">{totales.totalUnidades}</span></span>
            <span className="ml-6">Total Peso: <span className="font-extrabold title-pedido">{totales.totalPeso} kg</span></span>
          </div>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0 || !formState.documento_cliente || !formState.cliente}
            className="btn-module-pedido mt-4 md:mt-0 w-full md:w-auto"
          >
            {isSubmitting ? 'Generando...' : 'Descargar Pedido (XLSX)'}
          </button>
        </div>
      </section>
    </div>
  );
};
