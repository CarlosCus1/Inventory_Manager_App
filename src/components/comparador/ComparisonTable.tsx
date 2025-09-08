import React from 'react';
import type { IProductoEditado } from '../../interfaces';
import { PriceInput } from './PriceInput';

type ComparisonTableRow = IProductoEditado & Record<string, string | number | undefined>;

interface ComparisonTableProps {
  data: ComparisonTableRow[];
  competidores: string[];
  onPriceChange: (codigo: string, competidor: string, valor: number | null) => void;
  onDelete: (codigo: string) => void;
  getPercentageCellClass: (value: string | undefined) => string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  competidores,
  onPriceChange,
  onDelete,
  getPercentageCellClass,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full surface surface-border rounded-lg shadow-md">
        <thead className="surface-contrast">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Código</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Cod. EAN</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre</th>
            {competidores.map((comp, idx) => (
              idx === 0 ? (
                <th
                  key={comp}
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider relative"
                  title="Esta es la marca base para todos los cálculos de comparación y descuento. Ejemplo: Coloca tu marca principal aquí."
                >
                  {comp} <span className="ml-1 cursor-help text-[var(--color-info)]" title="Marca base para cálculos">&#9432;</span>
                </th>
              ) : (
                <th key={comp} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">{comp}</th>
              )
            ))}
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Precio Sugerido</th>
            {competidores.slice(1).map((comp) => (
              <th key={`pct-${comp}`} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">% vs {competidores[0]}</th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">% Descuento a Sugerido</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acción</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: ComparisonTableRow) => (
            <tr key={item.codigo} className="hover:opacity-90">
              <td className="px-6 py-4 whitespace-nowrap text-sm">{item.codigo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{item.cod_ean ?? ''}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{item.nombre}</td>
              {competidores.map((comp) => (
                <td key={`${item.codigo}-${comp}`} className="px-6 py-4 whitespace-nowrap">
                  <PriceInput
                    initialValue={item.precios?.[comp] ?? null}
                    onPriceChange={(value) => onPriceChange(item.codigo, comp, value)}
                    competidor={comp}
                    item={item}
                  />
                </td>
              ))}
              <td key={`${item.codigo}-sugerido`} className="px-6 py-4 whitespace-nowrap">
                <PriceInput
                  initialValue={item.precio_sugerido ?? null}
                  onPriceChange={(value) => onPriceChange(item.codigo, 'precio_sugerido', value)}
                  competidor="Sugerido"
                  item={item}
                />
              </td>
              {competidores.slice(1).map((comp) => {
                const keyPct = `% vs ${comp}`;
                const valorPct = (item as unknown as Record<string, string | undefined>)[keyPct] || 'N/A';
                return (
                  <td key={`pct-${item.codigo}-${comp}`} className={`px-6 py-4 whitespace-nowrap ${getPercentageCellClass(valorPct)}`}>
                    {valorPct}
                  </td>
                );
              })}
              <td key={`pct-${item.codigo}-sugerido`} className={`px-6 py-4 whitespace-nowrap ${getPercentageCellClass((item as unknown as Record<string, string | undefined>)['% Descuento a Sugerido'] || 'N/A')}`}>
                {(item as unknown as Record<string, string | undefined>)['% Descuento a Sugerido'] || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onDelete(item.codigo)}
                  className="bg-comparador-light-primary dark:bg-comparador-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-comparador-light-primary dark:focus:ring-comparador-dark-primary"
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
  );
};