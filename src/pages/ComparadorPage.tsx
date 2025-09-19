import React, { useState, useEffect, useMemo } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IProducto, IForm, FieldConfig, IProductoEditado } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { calculateDataWithPercentages } from '../utils/comparisonUtils';
import { DataTable, type IColumn } from '../components/DataTable';
import { PriceInput } from '../components/comparador/PriceInput';

import { exportXlsxApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';


type ComparisonTableRow = IProductoEditado & Record<string, string | number | undefined>;

// --- 2. Definición del Componente de Página ---
export const ComparadorPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.precios);
  const lista = useAppStore((state) => state.listas.precios) || [];
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);
  const eliminarProductoDeLista = useAppStore((state) => state.eliminarProductoDeLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [competidores, setCompetidores] = useState<string[]>([]);

  // --- C. Hooks y Utilidades ---
  const { addToast } = useToast();

  // Derivar los competidores de formState.precios con manejo de duplicados
  useEffect(() => {
    const marcas = [];
    for (let i = 1; i <= 5; i++) {
      const marca = formState[`marca${i}` as keyof IForm];
      if (typeof marca === 'string' && marca.trim() !== '') {
        marcas.push(marca.trim());
      }
    }

    if (marcas.length < 2) {
      setCompetidores(['Competidor 1', 'Competidor 2']);
    } else {
      // Manejar duplicados agregando numerales automáticamente
      const marcasUnicas: string[] = [];
      const contadorMarcas: { [key: string]: number } = {};

      for (const marca of marcas) {
        if (marcasUnicas.includes(marca)) {
          // Es un duplicado, agregar numeral
          contadorMarcas[marca] = (contadorMarcas[marca] || 1) + 1;
          const marcaConNumeral = `${marca}${contadorMarcas[marca]}`;
          marcasUnicas.push(marcaConNumeral);
        } else {
          // Primera ocurrencia
          contadorMarcas[marca] = 1;
          marcasUnicas.push(marca);
        }
      }

      setCompetidores(marcasUnicas);
    }
  }, [formState]);

  // --- C. Carga inicial de datos ---
  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // --- D. Lógica de Búsqueda ---
  const searchResults = useSearch(catalogo, searchTerm);

  // --- E. Lógica de la Tabla de Comparación ---
  const handlePriceChange = (codigo: string, competidor: string, valor: number | null) => {
    const productoActual = lista.find(p => p.codigo === codigo);
    if (!productoActual) return;

    if (competidor === 'precio_sugerido') {
      actualizarProductoEnLista('precios', codigo, 'precio_sugerido', valor ?? 0);
    } else {
      const nuevosPrecios = { ...(productoActual.precios || {}) };
      if (valor === null) {
        delete nuevosPrecios[competidor];
      } else {
        nuevosPrecios[competidor] = valor;
      }
      actualizarProductoEnLista('precios', codigo, 'precios', nuevosPrecios);
    }
  };

  const dataConPorcentajes = useMemo(() => {
    return calculateDataWithPercentages(lista, competidores);
  }, [lista, competidores]);



  const totales = useMemo(() => {
    const totalElementos = lista.length;
    return { totalElementos };
  }, [lista]);

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

    const marcas = [];
    for (let i = 1; i <= 5; i++) {
      const marca = formData[`marca${i}` as keyof IForm];
      if (typeof marca === 'string' && marca.trim() !== '') {
        marcas.push(marca.trim());
      }
    }
    if (marcas.length < 2) {
      errors.push('Debe ingresar al menos 2 marcas para comparar.');
    }

    if (errors.length > 0) {
      errors.forEach(error => addToast(error, 'warning'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Update formData with processed brand names (with numbers for duplicates)
      const updatedFormData = { ...formData };
      competidores.forEach((processedBrand, index) => {
        const marcaKey = `marca${index + 1}` as keyof IForm;
        updatedFormData[marcaKey] = processedBrand;
      });


      const payload: any = {
        tipo: 'precios',
        form: updatedFormData,
        list: dataConPorcentajes,
        usuario: {
          'nombre': userName,
          'correo': userEmail
        },
        totales: totales
      };
      const blob = await exportXlsxApi(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (blob as any).name || 'comparador_prices.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

      resetearModulo('precios');

    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("No se pudo generar el archivo de Excel. Verifique que el servidor backend esté funcionando.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentageCellClass = (value: string | undefined): string => {
    if (!value) return 'text-[var(--text-secondary)] font-semibold';
    const parsed = parseFloat(value.replace('%', ''));
    if (isNaN(parsed)) return 'text-[var(--text-secondary)] font-semibold';

    // Clases base para el borde y negrita
    const baseClasses = 'px-1 py-0.5 rounded border font-bold';

    if (parsed > 0) {
      return `${baseClasses} border-[var(--color-danger)]`;
    }
    if (parsed < 0) {
      return `${baseClasses} border-[var(--color-success)]`;
    }
    return 'text-[var(--text-primary)] font-semibold';
  };

  const columns = useMemo((): IColumn<ComparisonTableRow>[] => {
    const dynamicCompetitorColumns: IColumn<ComparisonTableRow>[] = competidores.map((comp, idx) => ({
      header: idx === 0 ? `${comp} (Base)` : comp,
      accessor: `precios.${comp}`,
      cellRenderer: (item) => (
        <PriceInput
          initialValue={item.precios?.[comp] ?? null}
          onPriceChange={(value) => handlePriceChange(item.codigo, comp, value)}
          competidor={comp}
          item={item}
        />
      ),
    }));

    const dynamicPercentageColumns: IColumn<ComparisonTableRow>[] = competidores.slice(1).map((comp) => ({
      header: `% ${comp} vs ${competidores[0]}`,
      accessor: `% vs ${comp}`,
      cellRenderer: (item) => {
        const keyPct = `% vs ${comp}`;
        const valorPct = (item as unknown as Record<string, string | undefined>)[keyPct] || 'N/A';
        return <span className={getPercentageCellClass(valorPct)}>{valorPct}</span>;
      },
    }));

    return [
      { header: 'Código', accessor: 'codigo' },
      { header: 'Cod. EAN', accessor: 'cod_ean' },
      { header: 'Nombre', accessor: 'nombre' },
      ...dynamicCompetitorColumns,
      {
        header: 'Precio Sugerido',
        accessor: 'precio_sugerido',
        cellRenderer: (item) => (
          <PriceInput
            initialValue={item.precio_sugerido ?? null}
            onPriceChange={(value) => handlePriceChange(item.codigo, 'precio_sugerido', value)}
            competidor="Sugerido"
            item={item}
          />
        ),
      },
      ...dynamicPercentageColumns,
      {
        header: '% Descuento a Sugerido',
        accessor: '% Descuento a Sugerido',
        cellRenderer: (item) => {
          const valorPct = (item as unknown as Record<string, string | undefined>)['% Descuento a Sugerido'] || 'N/A';
          return <span className={getPercentageCellClass(valorPct)}>{valorPct}</span>;
        },
      },
      {
        header: 'Acción',
        accessor: 'accion',
        cellRenderer: (item) => (
          <button
            onClick={() => eliminarProductoDeLista('precios', item.codigo)}
            className="btn btn-module-comparador"
            aria-label={`Eliminar ${item.nombre}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        ),
      },
    ];
  }, [competidores, handlePriceChange, eliminarProductoDeLista, getPercentageCellClass]);

  const fieldConfig: FieldConfig = {
    showRucDni: true,
    showCodigoCliente: true,
    showSucursal: true,
    showFecha: true,

    showMarcas: true,
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <PageHeader
        title="Análisis Comparativo de Precios"
        description="Ingresa entre 2 y 5 precios para comparar y conocer diferencias absolutas y porcentuales, así como identificar precios mínimos y máximos para optimizar decisiones de compra y venta."
        themeColor="comparador"
      />

      <section className="section-card">
        <DatosGeneralesForm tipo="precios" formState={formState} fieldConfig={fieldConfig} />
      </section>

      <section className="section-card">
        <h2 className="form-section-title title-comparador">Búsqueda y Selección</h2>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            aria-label="Buscar producto"
            placeholder="Buscar producto por código, EAN o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-module-comparador flex-1"
          />
          <LineSelectorModalTrigger
            moduloKey="precios"
            showStockRef={false}
            buttonClassName="btn btn-module-comparador ml-3"
            onConfirm={(_, skipped) => {
              if (skipped && skipped.length > 0) {
                console.warn(`Se omitieron ${skipped.length} duplicados ya presentes en la lista (Comparador).`);
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
              agregarProductoToLista('precios', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn btn-module-comparador ml-3"
          >
            Añadir Manualmente
          </button>
          <button
            onClick={handleExport}
            disabled={isSubmitting || lista.length === 0}
            className="btn btn-module-comparador ml-3"
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
                  agregarProductoToLista('precios', producto);
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
          <h2 className="form-section-title title-comparador mb-0">Tabla de Comparación</h2>
          <div className="text-lg font-semibold flex items-center gap-6 mt-4 md:mt-0">
            <span>Total Elementos: <span className="font-extrabold title-comparador">{totales.totalElementos}</span></span>
          </div>
        </div>
        <DataTable
          data={dataConPorcentajes}
          columns={columns}
          
          tableClassName="comparador-table"
        />
      </section>
    </div>
  );
};