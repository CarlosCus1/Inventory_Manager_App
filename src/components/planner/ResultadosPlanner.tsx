import React from 'react';
import { SummaryTable } from './SummaryTable';
import { DetailTable } from './DetailTable';
import { ComparisonTotals } from './ComparisonTotals';
import { SummaryChart } from './SummaryChart';

interface Props {
  resumenMensual: Record<string, number>;
  montoOriginal: number;
  montosAsignados: Record<string, number>;
  linea: string;
  onMontoAjustadoChange: (fecha: string, nuevoMonto: string) => void;
  onExportAjustado: () => void;
}

export const ResultadosPlanner: React.FC<Props> = ({
  resumenMensual,
  montoOriginal,
  montosAsignados,
  linea,
  onMontoAjustadoChange,
  onExportAjustado,
}) => {
  const adjustedTotal = React.useMemo(() => {
    return Object.values(montosAsignados).reduce((sum, amount) => sum + amount, 0);
  }, [montosAsignados]);

  const totalsMatch = Math.abs(adjustedTotal - montoOriginal) < 0.001; // Compare with a small tolerance for floating point issues

  // Do not render the section if there are no results yet
  if (Object.keys(montosAsignados).length === 0) {
    return null;
  }

  return (
    <section id="resultados" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-planificador-light-primary dark:text-planificador-dark-primary">3. Resultados</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SummaryTable
          resumenMensual={resumenMensual}
          montoOriginal={montoOriginal}
        />
        <ComparisonTotals
          montoOriginal={montoOriginal}
          montosAsignados={montosAsignados}
        />
        <div className="lg:col-span-2">
          <DetailTable
            montosAsignados={montosAsignados}
            onMontoChange={onMontoAjustadoChange}
          />
          <div className="mt-4 flex justify-end items-center gap-4">
            <div className={`text-lg font-bold p-2 rounded ${totalsMatch ? 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900' : 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900'}`}>
              <span>Total Ajustado: S/ {adjustedTotal.toFixed(2)}</span> / <span>S/ {montoOriginal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={onExportAjustado}
              disabled={!totalsMatch}
              className="bg-planificador-light-primary hover:bg-planificador-dark-secondary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Descargar Reporte
            </button>
          </div>
        </div>
        <div className="lg:col-span-2">
          <SummaryChart
              resumenMensual={resumenMensual}
              montoTotalGeneral={montoOriginal}
              linea={linea}
          />
        </div>
      </div>
    </section>
  );
};
