import React from 'react';
import * as DateUtils from '../../utils/dateUtils'; // Adjust path as needed

interface DetailTableProps {
  montosAsignados: Record<string, number>;
}

export const DetailTable: React.FC<DetailTableProps> = ({ montosAsignados }) => {
  const montosPorMes: Record<string, Array<{ date: string; amount: number }>> = {};
  for (const fechaStr in montosAsignados) {
    const monthKey = DateUtils.obtenerMesAnio(fechaStr);
    if (!montosPorMes[monthKey]) {
      montosPorMes[monthKey] = [];
    }
    montosPorMes[monthKey].push({
      date: fechaStr,
      amount: montosAsignados[fechaStr],
    });
  }

  const sortedMonthKeys = Object.keys(montosPorMes).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
  });

  return (
    <div className="results-detail-section">
      <h3>Detalle por Fecha (Ajuste Manual)</h3>
      <div id="tabla-detalle-horizontal" className="detalle-horizontal-container">
        {sortedMonthKeys.map(monthKey => {
          const monthTotal = montosPorMes[monthKey].reduce((sum, item) => sum + item.amount, 0);
          const monthDisplay = DateUtils.formatearMesAnioDisplay(monthKey);
          const yearShort = monthKey.substring(2, 4);
          const sortedDatesInMonth = montosPorMes[monthKey].sort((a, b) => DateUtils.parsearFecha(a.date).getTime() - DateUtils.parsearFecha(b.date).getTime());

          return (
            <div className="month-group" key={monthKey}>
              <div className="month-header">
                {`${monthDisplay.split(' ')[0]} ${yearShort}, S/ ${monthTotal.toFixed(2)}`}
              </div>
              {sortedDatesInMonth.map(item => (
                <div className="detail-item" key={item.date}>
                  <span>{item.date}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+([.][0-9]{1,2})?"
                    defaultValue={item.amount.toFixed(2)}
                    data-fecha={item.date}
                  />
                </div>
              ))}
              <div className="month-total">
                {`Total Mes: S/ ${monthTotal.toFixed(2)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};