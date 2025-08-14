import React from 'react';
import { SummaryTable } from './SummaryTable';
import { DetailTable } from './DetailTable';
import { ComparisonTotals } from './ComparisonTotals';
import { SummaryChart } from './SummaryChart';

interface Props {
  resumenMensual: Record<string, any>;
  montoOriginal: number;
  montosAsignados: Record<string, any>;
  linea: string;
}

export const ResultadosPlanner: React.FC<Props> = ({
  resumenMensual,
  montoOriginal,
  montosAsignados,
  linea
}) => {
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
          />
        </div>
        <div className="lg:col-span-2">
          <SummaryChart
              resumenMensual={resumenMensual}
              montoTotalGeneral={montoOriginal}
              linea={linea}
          />
        </div>
      </div>
      {/* Recalculate and download buttons can be added here later */}
    </section>
  );
};
