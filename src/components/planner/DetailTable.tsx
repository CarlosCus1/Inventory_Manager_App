import React from 'react';
import * as DateUtils from '../../utils/dateUtils'; // Adjust path as needed
import { StyledInput } from '../ui/StyledInput';

interface DetailTableProps {
  montosAsignadosStr: Record<string, string>;
  onMontoChange: (fecha: string, nuevoMonto: string) => void;
}

export const DetailTable: React.FC<DetailTableProps> = ({ montosAsignadosStr, onMontoChange }) => {
  const montosPorMes: Record<string, Array<{ date: string; amount: string }>> = {};
  for (const fechaStr in montosAsignadosStr) {
    const monthKey = DateUtils.obtenerMesAnio(fechaStr);
    if (!montosPorMes[monthKey]) {
      montosPorMes[monthKey] = [];
    }
    montosPorMes[monthKey].push({
      date: fechaStr,
      amount: montosAsignadosStr[fechaStr] || '',
    });
  }

  const sortedMonthKeys = Object.keys(montosPorMes).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
  });

  return (
    <div className="card">
      <h3 className="form-section-title">Detalle por Fecha (Ajuste Manual)</h3>
      <div id="tabla-detalle-horizontal" className="flex overflow-x-auto overflow-y-auto max-h-96 space-x-4 p-2 bg-panel dark:bg-panel-dark rounded">
        {sortedMonthKeys.map(monthKey => {
          const monthTotal = montosPorMes[monthKey].reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
          const monthDisplay = DateUtils.formatearMesAnioDisplay(monthKey);
          const yearShort = monthKey.substring(2, 4);
          const sortedDatesInMonth = montosPorMes[monthKey].sort((a, b) => DateUtils.parsearFecha(a.date).getTime() - DateUtils.parsearFecha(b.date).getTime());

          return (
            <div className="flex-shrink-0 w-64 border rounded-lg shadow-sm" key={monthKey}>
              <div className="font-bold p-2 bg-panel-dark dark:bg-panel-dark rounded-t-lg">
                {`${monthDisplay.split(' ')[0]} ${yearShort}, S/ ${monthTotal.toFixed(2)}`}
              </div>
              <div className="p-2 space-y-2">
                {sortedDatesInMonth.map(item => (
                  <div className="flex items-center justify-between" key={item.date}>
                    <span className="text-sm">{item.date}</span>
                    <StyledInput
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => onMontoChange(item.date, e.target.value)}
                      variant="planificador"
                      className="w-28 text-right"
                    />
                  </div>
                ))}
              </div>
              <div className="font-semibold p-2 bg-panel-dark dark:bg-panel-dark rounded-b-lg text-right">
                {`Total Mes: S/ ${monthTotal.toFixed(2)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};