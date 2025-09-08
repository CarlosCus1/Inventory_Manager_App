import React from 'react';
import { useAppStore } from './store/useAppStore';
import { DatosGeneralesForm } from './components/DatosGeneralesForm';
import { SeleccionFechas } from './components/planner/SeleccionFechas';
import type { FieldConfig } from './interfaces';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DayCellMountArg } from '@fullcalendar/core';
function App() {
  // --- 1. Conexión con el Store de Zustand ---
  const formState = useAppStore((state) => state.formState.planificador);
  const [selectedDates, setSelectedDates] = React.useState(new Set(['2024-01-15', '2024-01-22', '2024-01-29']));
  // --- 2. Lógica del Calendario y Acciones ---
  const handleDateClick = (arg: DateClickArg) => {
    const dateStr = arg.dateStr;
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    
    setSelectedDates(newSelectedDates);
  };

  const handleDayCellMount = (arg: DayCellMountArg) => {
    if (selectedDates.has(arg.date.toISOString().split('T')[0])) {
      arg.el.classList.add('fc-day-selected');
    }
  };

  const fetchCalendarEvents = (info: { start: Date; end: Date; }, successCallback: (events: []) => void, failureCallback: (error: Error) => void) => {
    console.log('Fetching events from', info.start, 'to', info.end, failureCallback);
    successCallback([]);
  };

  const handleCalcular = () => {
    console.log('Calculando con datos:', formState, 'y fechas:', Array.from(selectedDates));
  };

  const handleClearSelectedDates = () => {
    setSelectedDates(new Set());
  };

  const handleOpenBackupModal = () => {
    console.log('Abriendo modal de respaldo');
  };

  const isCalcularDisabled = !formState.montoOriginal || selectedDates.size === 0;

  // --- 3. Configuración de Campos para el Formulario ---
  const fieldConfig: FieldConfig = {
    showRucDni: true,
    showCodigoCliente: true,
    showSucursal: true,
    showMontoOriginal: true,
    showPedidoPlanificador: true,
    showLineaPlanificadorColor: true,
    showCargarRespaldo: true,
  };

  // --- 4. Renderizado del Componente ---
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <h1 className="text-4xl font-bold mb-4 text-center text-sky-600 dark:text-sky-400">
        Análisis de Componentes del Planificador
      </h1>

      <h2 className="text-xl mb-3 text-gray-600 dark:text-gray-400">
        Componentes Corregidos y Mejorados:
      </h2>

      {/* --- Sección de Datos Generales --- */}
      <section className="section-card">
        <DatosGeneralesForm 
          tipo="planificador" 
          formState={formState} // Added formState prop
          fieldConfig={fieldConfig} 
          onOpenBackupModal={handleOpenBackupModal} 
        />
      </section>

      {/* --- Sección de Selección de Fechas --- */}
      <section className="section-card mt-6">
         <SeleccionFechas
            selectedDates={selectedDates}
            onCalcular={handleCalcular}
            isCalcularDisabled={isCalcularDisabled}
            fetchCalendarEvents={fetchCalendarEvents}
            handleDateClick={handleDateClick}
            handleDayCellMount={handleDayCellMount}
            onClearSelectedDates={handleClearSelectedDates}
          />
      </section>

      {/* Aquí iría el showcase de componentes si aún es necesario */}

    </div>
  );
}

export default App;
// Archivo eliminado como parte de la eliminación del módulo planificador.
