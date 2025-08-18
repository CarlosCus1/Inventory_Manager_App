import React from 'react';
import { SummaryTable } from './SummaryTable';
import { DetailTable } from './DetailTable';
import { ComparisonTotals } from './ComparisonTotals';
import { SummaryChart } from './SummaryChart';

interface Props {
  resumenMensual: Record<string, number>;
  montoOriginal: number;
  montosAsignados: Record<string, number>;
  montosAsignadosStr: Record<string, string>;
  linea: string;
  onMontoAjustadoChange: (fecha: string, nuevoMonto: string) => void;
  onExportAjustado: () => void;
}

export const ResultadosPlanner: React.FC<Props> = ({
  resumenMensual,
  montoOriginal,
  montosAsignados,
  montosAsignadosStr,
  linea,
  onMontoAjustadoChange,
  onExportAjustado,
}) => {
  const adjustedTotal = React.useMemo(() => {
    return Object.values(montosAsignados).reduce((sum, amount) => sum + amount, 0);
  }, [montosAsignados]);

  const totalsMatch = Math.abs(adjustedTotal - montoOriginal) < 0.001; // Compare with a small tolerance for floating point issues

  const hasResults = Object.keys(montosAsignados).length > 0;

  return (
    <section id="resultados" className="section-card">
      <h2 className="form-section-title title-planificador">3. Resultados</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasResults ? (
          <>
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
            montosAsignadosStr={montosAsignadosStr}
                onMontoChange={onMontoAjustadoChange}
              />
            </div>
            <div className="lg:col-span-2">
              <SummaryChart
                  resumenMensual={resumenMensual}
                  montoTotalGeneral={montoOriginal}
                  linea={linea}
              />
            </div>
          </>
        ) : (
          <div className="lg:col-span-2 text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Complete los datos generales y seleccione las fechas para ver los resultados.
            </p>
          </div>
        )}
      </div>
      {hasResults && (
        <div className="mt-4 flex justify-end items-center gap-4">
          <div className={`text-lg font-bold p-2 rounded ${totalsMatch ? 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900' : 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900'}`}>
            <span>Total Ajustado: S/ {adjustedTotal.toFixed(2)}</span> / <span>S/ {montoOriginal.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={onExportAjustado}
            disabled={!totalsMatch}
            className="bg-planificador-light-primary dark:bg-planificador-dark-primary text-white font-bold py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-planificador-light-primary dark:focus:ring-planificador-dark-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Descargar Reporte
          </button>
        </div>
      )}
    </section>
  );
};