import React from 'react';
import * as DateUtils from '../../utils/dateUtils'; // Adjust path as needed

interface SummaryTableProps {
  resumenMensual: Record<string, number>;
  montoOriginal: number;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ resumenMensual, montoOriginal }) => {
  const totalMonto = montoOriginal;
  const sortedMonths = Object.keys(resumenMensual).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
  });

  return (
    <div>
      <h3 className="form-section-title">Resumen por Mes</h3>
      <table id="tabla-resumen" className="data-table">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Monto (S/)</th>
            <th>% del Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedMonths.map(mes => {
            const montoMes = resumenMensual[mes] || 0;
            const porcentaje = totalMonto > 0 ? ((montoMes / totalMonto) * 100).toFixed(2) : 0;
            return (
              <tr key={mes}>
                <td>{DateUtils.formatearMesAnioDisplay(mes)}</td>
                <td>{montoMes.toFixed(2)}</td>
                <td>{porcentaje}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};