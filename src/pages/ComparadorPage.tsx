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
import type { IProducto, IForm, IProductoEditado } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';

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

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [competidores, setCompetidores] = useState<string[]>([]);
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

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

  // Inicializar displayValues a partir de los precios existentes en la lista
  useEffect(() => {
    const initialDisplayValues: Record<string, string> = {};
    lista.forEach(item => {
      if (item.precios) {
        Object.entries(item.precios).forEach(([competidor, price]) => {
          initialDisplayValues[`${item.codigo}-${competidor}`] = price.toFixed(2);
        });
      }
    });
    setDisplayValues(initialDisplayValues);
  }, [lista]);

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

  const handleInputChange = (codigo: string, competidor: string, value: string) => {
    const key = `${codigo}-${competidor}`;
    setDisplayValues(prev => ({ ...prev, [key]: value }));
  };

  const handleInputBlur = (codigo: string, competidor: string, value: string) => {
    const key = `${codigo}-${competidor}`;
    const cleanedValue = value.replace(/[^0-9.]/g, '');

    let numericValue: number | null = null;
    let displayValueForUI: string = value; 

    if (cleanedValue !== '') {
      const parsed = parseFloat(cleanedValue);
      if (!isNaN(parsed)) {
        numericValue = parseFloat(parsed.toFixed(2));
        displayValueForUI = numericValue.toFixed(2); 
      } else {
        displayValueForUI = cleanedValue; 
      }
    } else {
      displayValueForUI = ''; 
    }
    
    handlePriceChange(codigo, competidor, numericValue);

    setDisplayValues(prev => ({ ...prev, [key]: displayValueForUI }));
  };

  const dataConPorcentajes = useMemo(() => {
    return lista.map(producto => {
      const precios = producto.precios || {};
      const p1 = precios[competidores[0]] || 0;
      const porcentajes: { [key: string]: string } = {};

      if (p1 > 0) {
        for (let i = 1; i < competidores.length; i++) {
          const pi = precios[competidores[i]] || 0;
          if (pi > 0) {
            const ratio = (p1 / pi) - 1;
            porcentajes[`% vs ${competidores[i]}`] = `${(ratio * 100).toFixed(2)}%`;
          } else {
            porcentajes[`% vs ${competidores[i]}`] = 'N/A';
          }
        }
      } else {
        for (let i = 1; i < competidores.length; i++) {
          porcentajes[`% vs ${competidores[i]}`] = 'N/A';
        }
      }

      return { ...producto, ...porcentajes };
    });
  }, [lista, competidores]);

  const resumenPorcentajes = useMemo(() => {
    const pctHeaders = competidores.slice(1).map((comp) => `% vs ${comp}`);
    const valores: number[] = [];

    for (const row of dataConPorcentajes) {
      for (const h of pctHeaders) {
        const raw = (row as unknown as Record<string, string | undefined>)[h];
        if (!raw) continue;
        const num = parseFloat(raw.replace('%', '').replace(',', '.'));
        if (Number.isFinite(num)) valores.push(num);
      }
    }

    if (valores.length === 0) {
      return { min: 0, max: 0, n: 0 };
    }
    let min = valores[0];
    let max = valores[0];
    for (const v of valores) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min, max, n: valores.length };
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
      <header className="mb-6 section-card">
        <h1 className="text-4xl font-extrabold title-comparador">Módulo Comparador de Precios</h1>
        <p className="mt-2">Compare los precios de sus productos con los de la competencia.</p>
      </header>

      <section className="section-card">
        <DatosGeneralesForm tipo="precios" />
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
        <div className="w-full overflow-x-auto">
          <table className="min-w-full surface surface-border rounded-lg shadow-md">
            <thead className="surface-contrast">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Cod. EAN</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre</th>
                {competidores.map((comp) => (
                  <th key={comp} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">{comp}</th>
                ))}
                {competidores.slice(1).map((comp) => (
                  <th key={`pct-${comp}`} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">% vs {competidores[0]}</th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {dataConPorcentajes.map((item: IProductoEditado) => (
                <tr key={item.codigo} className="hover:opacity-90">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.cod_ean ?? ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.nombre}</td>
                  {competidores.map((comp) => (
                    <td key={`${item.codigo}-${comp}`} className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="text"
                        aria-label={`Precio de ${item.nombre} en ${comp}`}
                        placeholder="S/. 0.00"
                        value={displayValues[`${item.codigo}-${comp}`] || ''}
                        onChange={(e) => handleInputChange(item.codigo, comp, e.target.value)}
                        onBlur={(e) => handleInputBlur(item.codigo, comp, e.target.value)}
                        className="input input-module-comparador w-full"
                      />
                    </td>
                  ))}
                  {competidores.slice(1).map((comp) => {
                    const keyPct = `% vs ${comp}`;
                    const valorPct = (item as unknown as Record<string, string | undefined>)[keyPct] || 'N/A';
                    return (
                      <td key={`pct-${item.codigo}-${comp}`} className={`px-6 py-4 whitespace-nowrap ${getPercentageCellClass(valorPct)}`}>
                        {valorPct}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => eliminarProductoDeLista('precios', item.codigo)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-150"
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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