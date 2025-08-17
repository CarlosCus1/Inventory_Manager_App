import React from 'react';
import * as DateUtils from '../../utils/dateUtils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { type DateClickArg } from '@fullcalendar/interaction';
import { type DayCellContentArg } from '@fullcalendar/core';

interface Props {
  selectedDates: Set<string>;
  onCargarRespaldoClick: () => void;
  onCalcular: () => void;
  isCalcularDisabled: boolean;
  fetchCalendarEvents: (info: { start: Date; end: Date; timeZone: string; }, successCallback: (events: []) => void, failureCallback: (error: Error) => void) => void;
  handleDateClick: (arg: DateClickArg) => void;
  handleDayCellMount: (arg: DayCellContentArg) => void;
}

export const SeleccionFechas: React.FC<Props> = ({
  selectedDates,
  onCargarRespaldoClick,
  onCalcular,
  isCalcularDisabled,
  fetchCalendarEvents,
  handleDateClick,
  handleDayCellMount
}) => {

  const getTooltipText = () => {
    if (isCalcularDisabled) {
      return "Por favor, complete todos los campos de Datos Generales y seleccione al menos una fecha.";
    }
    return "Calcular la distribución de pagos con los datos y fechas seleccionadas";
  };

  return (
    <section id="seleccion-fechas" className="card">
      <h2 className="form-section-title title-planificador">2. Selección de Fechas</h2>
      <div className="mb-4 w-full overflow-x-auto">
        <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            locale='es'
            initialView='dayGridMonth'
            height='auto'
            fixedWeekCount={true}
            headerToolbar={{
              left: 'prev,today,next',
              center: 'title',
              right: ''
            }}
            buttonText={{
              today: 'Hoy'
            }}
            eventSources={[
              {
                events: fetchCalendarEvents
              }
            ]}
            dateClick={handleDateClick}
            dayCellDidMount={handleDayCellMount}
        />
      </div>

      <div className="fechas-seleccionadas">
        <h3 className="text-lg font-semibold mb-2 title-planificador">Fechas Seleccionadas ({selectedDates.size})</h3>
        <ul className="max-h-48 overflow-y-auto border border-sky-300 dark:border-sky-700 rounded-md p-2">
          {Array.from(selectedDates)
            .sort((a, b) => DateUtils.parsearFecha(a).getTime() - DateUtils.parsearFecha(b).getTime())
            .map(fecha => {
              const diasRestantes = DateUtils.diasDesdeHoy(fecha);
              let textoDias = '';
              switch (diasRestantes) {
                case 0:
                  textoDias = ' (Hoy)';
                  break;
                case 1:
                  textoDias = ' (Mañana)';
                  break;
                case -1:
                  textoDias = ' (Ayer)';
                  break;
                default:
                  if (diasRestantes > 1) {
                    textoDias = ` (en ${diasRestantes} días)`;
                  } else {
                    textoDias = ` (hace ${Math.abs(diasRestantes)} días)`;
                  }
                  break;
              }
              return <li key={fecha} className="py-1 border-b border-b-sky-200 dark:border-b-sky-800 last:border-b-0">{`${fecha}${textoDias}`}</li>;
            })}
        </ul>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCargarRespaldoClick}
          className="btn-outline-planificador"
          title="Cargar un estado guardado previamente"
        >
          Cargar Respaldo
        </button>
        <button
          type="button"
          onClick={onCalcular}
          disabled={isCalcularDisabled}
          className={`font-bold py-2 px-6 rounded-lg text-lg transition-all transform ${
            isCalcularDisabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-planificador-light-primary hover:bg-blue-700 text-white hover:scale-105'
          }`}
          title={getTooltipText()}
        >
          Calcular
        </button>
      </div>
    </section>
  );
};