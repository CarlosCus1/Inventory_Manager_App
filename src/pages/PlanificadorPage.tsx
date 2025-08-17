import React, { useState, useEffect, useRef, useCallback } from 'react';

import * as DateUtils from '../utils/dateUtils';
import { calcular as calcularApi } from '../utils/api'; // Renamed calcular to calcularApi
import { MAX_FECHAS } from '../utils/config';
import { FormValidator } from '../utils/formValidator';

import { useAppStore } from '../store/useAppStore';
import type { IForm } from '../interfaces';
import { useRucDni } from '../hooks/useRucDni';
import { type DateClickArg } from '@fullcalendar/interaction';
import { type DayCellContentArg } from '@fullcalendar/core';
import { SeleccionFechas } from '../components/planner/SeleccionFechas';
import { DatosGeneralesPlanner } from '../components/planner/DatosGeneralesPlanner';
import { ResultadosPlanner } from '../components/planner/ResultadosPlanner';

import './PlanificadorPage.css';
import PageHeader from '../components/PageHeader';

// Define initial state interface (for better type safety)
// This local state only holds data not related to the form itself.
interface PlannerState {
  selectedDates: Set<string>;
  fechasOrdenadas: string[];
  montosAsignados: Record<string, number>;
  resumenMensual: Record<string, number>;
  isDataDirty: boolean;
}

export const PlanificadorPage: React.FC = () => {
  const [plannerState, setPlannerState] = useState<PlannerState>({
    selectedDates: new Set(),
    fechasOrdenadas: [],
    montosAsignados: {},
    resumenMensual: {},
    isDataDirty: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [montosAjustados, setMontosAjustados] = useState<Record<string, number>>({});

  const [isCalcularDisabled, setCalcularDisabled] = useState(true);


  const fetchHolidays = useAppStore(state => state.fetchHolidays);
  const formState = useAppStore(state => state.formState.planificador);
  const actualizarFormulario = useAppStore(state => state.actualizarFormulario);

  const {
    rucEstado,
    rucCondicion,
    isLoadingRuc,
    rucError,
    handleRucDniChange,
    handleRazonSocialManualChange,
  } = useRucDni('planificador');

  const feriadosCargados = useRef(new Map<string, string>());


  const btnCalcularRef = useRef<HTMLButtonElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch calendar events (holidays)
  const fetchCalendarEvents = useCallback(async (fetchInfo: { start: Date; end: Date; timeZone: string; }, successCallback: (events: []) => void, failureCallback: (error: Error) => void) => {
    try {
      const year = fetchInfo.start.getFullYear();
      const feriados = await fetchHolidays(year) as Array<{ date: string; name: string }>;

      feriadosCargados.current.clear();
      feriados.forEach((feriado) => {
        feriadosCargados.current.set(feriado.date, feriado.name);
      });

      successCallback([]); // Return empty array for events, as styling is handled by dayCellDidMount
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
      failureCallback(error as Error);
    }
  }, [fetchHolidays]);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const dateStr = DateUtils.formatearFecha(arg.date);
    const isHoliday = feriadosCargados.current.has(dateStr);
    const isSunday = arg.date.getDay() === 0;

    if (DateUtils.esPasado(arg.date) || isSunday || isHoliday) {
      return;
    }

    setPlannerState(prevState => {
      const newSelectedDates = new Set(prevState.selectedDates);
      if (newSelectedDates.has(dateStr)) {
        newSelectedDates.delete(dateStr);
      } else {
        if (newSelectedDates.size >= MAX_FECHAS) {
          return prevState; // Return previous state if max dates reached
        }
        newSelectedDates.add(dateStr);
      }
      // No direct classList manipulation here, React will re-render based on state
      return { ...prevState, selectedDates: newSelectedDates, isDataDirty: true };
    });
  }, [feriadosCargados]);

  const handleDayCellMount = useCallback((arg: DayCellContentArg) => {
    const dateStr = DateUtils.formatearFecha(arg.date);
    
    // Apply class if the date is selected
    if (plannerState.selectedDates.has(dateStr)) {
      arg.el.classList.add('fc-day-selected');
    }

    // Apply class and tooltip if the date is a holiday
    if (feriadosCargados.current.has(dateStr)) {
      arg.el.classList.add('fc-holiday');
      arg.el.setAttribute('title', feriadosCargados.current.get(dateStr) || '');
    }
  }, [plannerState.selectedDates]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    actualizarFormulario('planificador', name as keyof IForm, value);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
  };

  const handleMontoAjustadoChange = (fecha: string, nuevoMonto: string) => {
    const montoNumerico = parseFloat(nuevoMonto);
    if (isNaN(montoNumerico)) {
      // Si el valor no es un número, se podría manejar el error o simplemente no actualizar
      // Por ahora, lo guardaremos como está para permitir la limpieza del campo
    }
    setMontosAjustados(prev => ({
      ...prev,
      [fecha]: isNaN(montoNumerico) ? 0 : montoNumerico,
    }));
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
  };


  // Recalculate validation state whenever form or selections change
  useEffect(() => {
  const _updateActionButtonsState = useCallback(() => {

    const monto = Number(formState.montoOriginal) || 0;
    const fechas = Array.from(plannerState.selectedDates);
    const pedido = formState.pedido_planificador?.trim() || '';
    const cliente = formState.cliente?.trim() || '';

    if (!btnCalcularRef.current) return;

    const isMontoValid = monto > 0;
    const areFechasValid = fechas.length > 0;
    const isClienteValid = cliente.length > 0;
    const isPedidoValid = pedido.length > 0;

    const canCalculate = isMontoValid && areFechasValid && isClienteValid && isPedidoValid;


    setCalcularDisabled(!canCalculate);

  }, [formState, plannerState.selectedDates]);
    btnCalcularRef.current.disabled = !canCalculate;

    if (!canCalculate) {
      const tooltips = [];
      if (!isMontoValid) tooltips.push('Ingrese un monto válido.');
      if (!areFechasValid) tooltips.push('Seleccione al menos una fecha.');
      if (!isClienteValid) tooltips.push('Ingrese la razón social del cliente.');
      if (!isPedidoValid) tooltips.push('Ingrese el código del pedido.');
      btnCalcularRef.current.title = tooltips.join(' ');
    } else {
      btnCalcularRef.current.title = 'Realizar el cálculo de distribución';
    }
  }, [formState, plannerState.selectedDates]);

  useEffect(() => {
    _updateActionButtonsState();
  }, [formState, plannerState.selectedDates, _updateActionButtonsState]);

  const _getAndValidateFormData = useCallback(() => {
    const monto = Number(formState.montoOriginal) || 0;
    const ruc = formState.documento_cliente || '';
    const razonSocial = formState.cliente || '';
    const pedido = formState.pedido_planificador || '';
    const fechas = Array.from(plannerState.selectedDates);

    const { fieldErrors, generalErrors, isValid } = FormValidator.validate({
      monto,
      fechas,
      ruc: ruc.trim(),
      razonSocial: razonSocial.trim(),
      pedido: pedido.trim()
    });

    return {
      fieldErrors,
      generalErrors,
      isValid,
      payload: { montoTotal: monto, fechasValidas: fechas, razonSocial: razonSocial.trim() },
      uiData: { ...formState } // Pass all form state to uiData
    };
  }, [formState, plannerState.selectedDates]);

  const calcular = useCallback(async () => {
    const { fieldErrors, generalErrors, isValid, payload } = _getAndValidateFormData();

    if (!isValid) {
      const newErrors = fieldErrors.reduce((acc, error) => {
        // Map validator field names to component IDs
        const fieldMap: Record<string, string> = {
          monto: 'montoOriginal',
          razonSocial: 'cliente',
          ruc: 'documento_cliente',
          pedido: 'pedido_planificador'
        };
        const componentId = fieldMap[error.field] || error.field;
        acc[componentId] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(newErrors);

      if (generalErrors.length > 0) {
        // Here you might want to use a toast notification library
        alert(`Por favor revise los siguientes puntos:\n- ${generalErrors.join('\n- ')}`);
      }
      return;
    }
    
    setErrors({}); // Clear errors on successful validation

    try {
      // mostrarLoading(true, 'Calculando distribución...');
      const resultado = await calcularApi(payload); // Renamed to avoid conflict with local function

      // Update local state with calculation results
      setPlannerState(prevState => ({
        ...prevState,
        fechasOrdenadas: payload.fechasValidas,
        montosAsignados: resultado.montosAsignados,
        resumenMensual: resultado.resumenMensual,
        isDataDirty: false
      }));
      // Initialize adjusted amounts with the calculated ones
      setMontosAjustados(resultado.montosAsignados);

      // Form data is already in the global store, so no need to set it here.

      // mostrarResults(); // Now handled by React rendering
    } catch (error) {
      console.error('Error en cálculo:', error);
      // mostrarToast((error as Error).message || 'Error al realizar el cálculo', 'error');
    } finally {
      // mostrarLoading(false);
    }
  }, [_getAndValidateFormData]);

  const handleExportAjustado = useCallback(async () => {
    // This function will be similar to other handleExport functions
    // It will send the adjusted data to the backend
    const payload = {
      tipo: 'planificador',
      form: formState,
      // The backend expects a 'montosAsignados' key in the main data object
      montosAsignados: montosAjustados,
      fechasOrdenadas: plannerState.fechasOrdenadas,
      resumenMensual: plannerState.resumenMensual,
      montoOriginal: formState.montoOriginal,
      razonSocial: formState.cliente,
      // Pass other necessary data from formState
      codigoCliente: formState.codigo_cliente,
      ruc: formState.documento_cliente,
      linea: formState.linea_planificador_color,
      pedido: formState.pedido_planificador,
    };


    try {
      const response = await fetch('http://localhost:5000/export-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor al exportar.');
      }

    try {
      const response = await fetch('http://localhost:5000/export-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor al exportar.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'planificador_ajustado.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("No se pudo generar el archivo de Excel.");
    }
  }, [formState, montosAjustados, plannerState.fechasOrdenadas, plannerState.resumenMensual]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // Basic validation of the loaded data
      if (data && data.montosAsignados && data.selectedDates) {
        const localPlannerUpdate: Partial<PlannerState> = {
            selectedDates: new Set(data.selectedDates || []),
            fechasOrdenadas: data.fechasOrdenadas || [],
            montosAsignados: data.montosAsignados || {},
            resumenMensual: data.resumenMensual || {},
            isDataDirty: false,
        };
        setPlannerState(prevState => ({ ...prevState, ...localPlannerUpdate }));
        setMontosAjustados(data.montosAsignados || {});

        // Also update the global form state
        const formFieldsToUpdate: Array<keyof IForm> = ['montoOriginal', 'cliente', 'documento_cliente', 'codigo_cliente', 'sucursal', 'pedido_planificador', 'linea_planificador_color'];
        formFieldsToUpdate.forEach(field => {
            const value = data[field];
            if (value !== undefined) {
                actualizarFormulario('planificador', field, value);
            }
        });

        // mostrarToast('Respaldo cargado correctamente.', 'success');
      } else {
        // mostrarToast('El archivo de respaldo no tiene el formato esperado.', 'error');
      }
    } catch (error) {
      console.error('Error al cargar el respaldo:', error);
      // mostrarToast('Error al procesar el archivo de respaldo.', 'error');
    }

    // Reset file input to allow loading the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [actualizarFormulario]);

  const handleCargarRespaldoClick = () => {
    fileInputRef.current?.click();
  };

  // Equivalent of PlanificadorApp.init()
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('PlanificadorPage: Initializing app...');

        // Example of migrating state from localStorage (if any)
        const cachedState = localStorage.getItem('planificadorAppData');
        if (cachedState) {
          const parsedState = JSON.parse(cachedState) as { plannerState: PlannerState, formState: { planificador: IForm } };
          if (parsedState.plannerState && Array.isArray(parsedState.plannerState.selectedDates)) {
            parsedState.plannerState.selectedDates = new Set(parsedState.plannerState.selectedDates);
          }
          setPlannerState(prevState => ({...prevState, ...parsedState.plannerState}));

          const formFieldsToUpdate: Array<keyof IForm> = ['montoOriginal', 'cliente', 'documento_cliente', 'codigo_cliente', 'sucursal', 'pedido_planificador', 'linea_planificador_color'];
          formFieldsToUpdate.forEach(field => {
              const value = parsedState.formState?.planificador?.[field];
              if (value !== undefined) {
                  actualizarFormulario('planificador', field, value);
              }
          });
        }
      } catch (error) {
        console.error('Error initializing PlanificadorPage:', error);
        // mostrarToast('Error al iniciar la aplicación', 'error');
      }
    };

    initializeApp();
  }, [actualizarFormulario]);


  return (

    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen font-sans">
      <header className="bg-planificador-light-primary dark:bg-planificador-dark-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold">Planificador de Vencimientos</h1>
          {/* Theme toggle can be added here if needed */}
        </div>
      </header>

      <main className="container mx-auto p-4">
    <div className="container mx-auto p-4 md:p-8 min-h-screen surface">
      <PageHeader
        title="Planificador de Vencimientos"
        description="Distribuye montos en el tiempo de forma equitativa, con selección de fechas en calendario y opción de ajuste manual para cada vencimiento."
        themeColor="planificador"
      />
      <main>
        <div id="loading-overlay" style={{ display: isLoadingRuc ? 'flex' : 'none' }}>
          <div className="spinner"></div>
          <p id="loading-message">Cargando...</p>
        </div>

        <div id="toast-container"></div>

        {/* Hidden File Input for Backup Loading */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          style={{ display: 'none' }}
        />

        {/* Page Content */}

        <div className="mt-4 space-y-8">
        <div className="space-y-8">

          <DatosGeneralesPlanner
            formState={formState}
            onFormChange={handleFormChange}
            onRucDniChange={handleRucDniChange}
            onRazonSocialManualChange={handleRazonSocialManualChange}
            rucEstado={rucEstado}
            rucCondicion={rucCondicion}
            isLoadingRuc={isLoadingRuc}
            rucError={rucError}

            onCalcular={calcular}

          />

          <SeleccionFechas
            selectedDates={plannerState.selectedDates}
            onCargarRespaldoClick={handleCargarRespaldoClick}
            fetchCalendarEvents={fetchCalendarEvents}
            handleDateClick={handleDateClick}
            handleDayCellMount={handleDayCellMount}

            onCalcular={calcular}
            isCalcularDisabled={isCalcularDisabled}
            
          />

          <ResultadosPlanner
            resumenMensual={plannerState.resumenMensual}
            montoOriginal={Number(formState.montoOriginal) || 0}
            montosAsignados={montosAjustados} // Usar los montos ajustados para la tabla
            linea={formState.linea_planificador_color || ''}
            onMontoAjustadoChange={handleMontoAjustadoChange}
            onExportAjustado={handleExportAjustado}
          />
        </div>
      </main>
    </div>
  );
};