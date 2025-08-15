// --------------------------------------------------------------------------- #
//                                                                             #
//                    src/pages/ComparadorPage.tsx                           #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useState, useEffect, useMemo } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IProducto, IForm } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import PageHeader from '../components/PageHeader';
import { calculateDataWithPercentages, calculateSummary } from '../utils/comparisonUtils';
import { ComparisonTable } from '../components/comparador/ComparisonTable';
import { FormGroup, Label } from '../components/ui/FormControls';
import { StyledInput } from '../components/ui/StyledInput';

// --- 2. Definición del Componente de Página ---
export const ComparadorPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  const catalogo = useAppStore((state) => state.catalogo);
  const cargarCatalogo = useAppStore((state) => state.cargarCatalogo);
  const formState = useAppStore((state) => state.formState.precios);
  const lista = useAppStore((state) => state.listas.precios);
  const agregarProductoToLista = useAppStore((state) => state.agregarProductoToLista);
  const actualizarProductoEnLista = useAppStore((state) => state.actualizarProductoEnLista);
  const eliminarProductoDeLista = useAppStore((state) => state.eliminarProductoDeLista);
  const resetearModulo = useAppStore((state) => state.resetearModulo);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [competidores, setCompetidores] = useState<string[]>([]);

  // Derivar los competidores de formState.precios
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
      setCompetidores(marcas);
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

    const nuevosPrecios = { ...(productoActual.precios || {}) };
    if (valor === null) {
      delete nuevosPrecios[competidor];
    } else {
      nuevosPrecios[competidor] = valor;
    }

    actualizarProductoEnLista('precios', codigo, 'precios', nuevosPrecios);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    actualizarFormulario('precios', name as keyof IForm, value);
  };


  const dataConPorcentajes = useMemo(() => {
    return calculateDataWithPercentages(lista, competidores);
  }, [lista, competidores]);

  const resumenPorcentajes = useMemo(() => {
    return calculateSummary(dataConPorcentajes, competidores);
  }, [dataConPorcentajes, competidores]);

  const totales = useMemo(() => {
    const totalElementos = lista.length;
    return { totalElementos };
  }, [lista]);

  const handleExport = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/export-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tipo: 'precios', 
          form: formState, 
          list: dataConPorcentajes
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta del servidor.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'comparador_prices.xlsx';
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
    if (!value) return 'text-[var(--fg)] font-semibold';
    const parsed = parseFloat(value.replace('%',''));
    if (isNaN(parsed)) return 'text-[var(--fg)] font-semibold';
    if (parsed > 0) return 'text-red-600 font-semibold';
    if (parsed < 0) return 'text-green-600 font-semibold';
    return 'text-[var(--fg)] font-semibold';
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">

      <PageHeader
        title="Análisis Comparativo de Precios"
        description="Ingresa entre 2 y 5 precios para comparar y conocer diferencias absolutas y porcentuales, así como identificar precios mínimos y máximos para optimizar decisiones de compra y venta."
        themeColor="comparador"
      />

      <header className="mb-6 section-card">
        <h1 className="text-4xl font-extrabold title-comparador">Módulo Comparador de Precios</h1>
        <p className="mt-2">Compare los precios de sus productos con los de la competencia.</p>
      </header>

      <section className="section-card">
        <DatosGeneralesForm tipo="precios">
          <FormGroup>
            <Label htmlFor="colaborador_personal">Colaborador / Personal</Label>
            <StyledInput
              type="text"
              id="colaborador_personal"
              name="colaborador_personal"
              value={formState.colaborador_personal || ''}
              onChange={handleFormChange}
              placeholder="Nombre del colaborador"
              variant="comparador"
            />
          </FormGroup>
          {/* Loop to generate Marca inputs */}
          {Array.from({ length: 5 }).map((_, i) => (
            <FormGroup key={i}>
              <Label htmlFor={`marca${i + 1}`}>{`Marca ${i + 1}`}</Label>
              <StyledInput
                type="text"
                id={`marca${i + 1}`}
                name={`marca${i + 1}`}
                value={formState[`marca${i + 1}` as keyof IForm] as string || ''}
                onChange={handleFormChange}
                placeholder={`Marca ${i + 1}`}
                variant="comparador"
              />
            </FormGroup>
          ))}
          <FormGroup>
            <Label htmlFor="fecha">Fecha</Label>
            <StyledInput
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleFormChange}
              variant="comparador"
            />
          </FormGroup>
        </DatosGeneralesForm>
      </section>

      <section className="section-card">
        <h2 className="text-2xl font-bold mb-4 title-comparador">Búsqueda y Selección</h2>
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
            buttonClassName="btn-module-comparador ml-3"
            themeClass="title-comparador btn-module-comparador"
            onConfirm={(_, skipped) => {
              if (skipped.length > 0) {
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
                peso: 0,
                stock_referencial: 0,
                linea: '',
              };
              agregarProductoToLista('precios', newProduct);
              setSearchTerm('');
            }}
            disabled={!searchTerm || searchResults.length > 0}
            className="btn-module-comparador ml-3"
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
                  agregarProductoToLista('precios', producto); 
                  setSearchTerm('');
                }}
                className="p-3 hover:opacity-90 cursor-pointer border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                {producto.nombre} ({producto.codigo})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-card">
        <h2 className="text-2xl font-bold mb-4 title-comparador">Tabla de Comparación</h2>
        <div className="mb-4 flex flex-wrap gap-6 text-sm md:text-base" title={`Cálculo sobre columnas “% vs …”. Muestras: ${resumenPorcentajes.n}`}>
          <span>Min: <strong className="title-comparador">{resumenPorcentajes.min.toFixed(2)}%</strong></span>
          <span>Max: <strong className="title-comparador">{resumenPorcentajes.max.toFixed(2)}%</strong></span>
        </div>
        <ComparisonTable
          data={dataConPorcentajes}
          competidores={competidores}
          onPriceChange={handlePriceChange}
          onDelete={(codigo) => eliminarProductoDeLista('precios', codigo)}
          getPercentageCellClass={getPercentageCellClass}
        />
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-lg font-semibold">
            <span>Total Elementos: <span className="font-extrabold title-comparador">{totales.totalElementos}</span></span>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={handleExport}
              disabled={isSubmitting || lista.length === 0 || !formState.colaborador}
              className="btn-module-comparador w-full md:w-auto"
            >
              {isSubmitting ? 'Generando...' : 'Descargar Comparación (XLSX)'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};