import React from 'react';

interface ComparisonTotalsProps {
  montoOriginal: number;
  montosAsignados: Record<string, number>;
}

export const ComparisonTotals: React.FC<ComparisonTotalsProps> = ({ montoOriginal, montosAsignados }) => {
  const sumaMontosDetallados = Object.values(montosAsignados).reduce((sum, monto) => sum + monto, 0);
  const tolerance = 0.01;
  const diferencia = sumaMontosDetallados - montoOriginal;
  const statusText = Math.abs(montoOriginal - sumaMontosDetallados) < tolerance ? 'Coincide' : `No Coincide (Diferencia: S/ ${diferencia.toFixed(2)})`;
  const statusClass = Math.abs(montoOriginal - sumaMontosDetallados) < tolerance ? 'status-ok' : 'status-error';

  return (
    <div className="table-container">
      <h3>Totales Comparativos</h3>
      <div id="totales-comparativos">
        <div className="comparison-item">
          <span>Monto Original:</span>
          <strong id="monto-original-display">S/ {montoOriginal.toFixed(2)}</strong>
        </div>
        <div className="comparison-item">
          <span>Suma Detallada:</span>
          <strong id="suma-montos-detallados-display">S/ {sumaMontosDetallados.toFixed(2)}</strong>
        </div>
        <div className="comparison-status">
          <span id="estado-totales" className={statusClass}>{statusText}</span>
        </div>
      </div>
    </div>
  );
};