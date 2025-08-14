import React, { useState, useEffect, useRef, useCallback } from 'react';

import * as DateUtils from '../utils/dateUtils';
import { calcular as calcularApi } from '../utils/api'; // Renamed calcular to calcularApi
import { MAX_FECHAS } from '../utils/config';
import { FormValidator } from '../utils/formValidator';

import { useAppStore } from '../store/useAppStore';
import { useRucManager } from '../hooks/useRucManager';
import { SeleccionFechas } from '../components/planner/SeleccionFechas';
import { DatosGeneralesPlanner } from '../components/planner/DatosGeneralesPlanner';
import { ResultadosPlanner } from '../components/planner/ResultadosPlanner';
import './PlanificadorPage.css';

// Define initial state interface (for better type safety)
interface PlannerState {
  montoOriginal: number;
  selectedDates: Set<string>;
  fechasOrdenadas: string[];
  montosAsignados: Record<string, any>;
  resumenMensual: Record<string, any>;
  cliente: string;
  ruc: string;
  descCliente: string;
  linea: string;
  pedido: string;
  codigoCliente: string;
  isDataDirty: boolean;
}

export const PlanificadorPage: React.FC = () => {
  const [plannerState, setPlannerState] = useState<PlannerState>({
    montoOriginal: 0,
    selectedDates: new Set(),
    fechasOrdenadas: [],
    montosAsignados: {},
    resumenMensual: {},
    cliente: '',
    ruc: '',
    descCliente: '',
    linea: '',
    pedido: '',
    codigoCliente: '',
    isDataDirty: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchHolidays = useAppStore((state: any) => state.fetchHolidays);

  const feriadosCargados = useRef(new Map<string, string>()); // Use useRef for mutable map

  // Refs for DOM elements that were previously accessed by getElementById
  const {
    ruc,
    setRuc,
    razonSocial,
    setRazonSocial,
    error: rucError,
    isLoading: isRucLoading,
    handleRucSearch,
  } = useRucManager(plannerState.ruc, plannerState.descCliente);

  const btnCalcularRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch calendar events (holidays)
  const fetchCalendarEvents = useCallback(async (fetchInfo: { start: Date }, successCallback: (events: any[]) => void, failureCallback: (error: Error) => void) => {
    try {
      const year = fetchInfo.start.getFullYear();
      const feriados = await fetchHolidays(year);

      feriadosCargados.current.clear();
      feriados.forEach((feriado: { date: string, name: string }) => {
        feriadosCargados.current.set(feriado.date, feriado.name);
      });

      successCallback([]); // Return empty array for events, as styling is handled by dayCellDidMount
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
      failureCallback(error as Error);
    }
  }, [fetchHolidays]);

  const handleDateClick = useCallback((arg: { date: Date }) => {
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
      return { ...prevState, selectedDates: newSelectedDates };
    });

    // handleFormChange will be called by a useEffect that watches plannerState
    // actualizarListaFechas will be called by a useEffect that watches plannerState.selectedDates
  }, [feriadosCargados, MAX_FECHAS]);

  const handleDayCellMount = useCallback((arg: { date: Date, el: HTMLElement }) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setPlannerState(prevState => ({ ...prevState, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
    handleFormChange();
  };

  // Specific handlers to clear validation errors on user input
  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setRuc(value.replace(/\D/g, ''));
    if (errors.ruc || rucError) {
      setErrors(prev => ({ ...prev, ruc: '' }));
    }
  };

  const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setRazonSocial(value);
    if (errors.descCliente) {
      setErrors(prev => ({ ...prev, descCliente: '' }));
    }
  };

  const _updateActionButtonsState = useCallback(() => {
    const monto = plannerState.montoOriginal;
    const fechas = Array.from(plannerState.selectedDates);
    const pedido = plannerState.pedido.trim() || '';

    if (!btnCalcularRef.current) return;

    const isMontoValid = monto > 0;
    const areFechasValid = fechas.length > 0;
    const isClienteValid = razonSocial.trim().length > 0;
    const isPedidoValid = pedido.length > 0;

    const canCalculate = isMontoValid && areFechasValid && isClienteValid && isPedidoValid;

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
  }, [plannerState.montoOriginal, plannerState.selectedDates, plannerState.pedido, razonSocial]);

  const handleFormChange = useCallback(() => {
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
    _updateActionButtonsState();
  }, [_updateActionButtonsState]);

  const _getAndValidateFormData = useCallback(() => {
    const monto = plannerState.montoOriginal;
    const linea = plannerState.linea;
    const pedido = plannerState.pedido.trim();
    const fechas = Array.from(plannerState.selectedDates);
    const codigoCliente = plannerState.codigoCliente.trim();

    const { fieldErrors, generalErrors, isValid } = FormValidator.validate({
      monto,
      fechas,
      ruc: ruc.trim(),
      razonSocial: razonSocial.trim(),
      pedido
    });

    return {
      fieldErrors,
      generalErrors,
      isValid,
      payload: { montoTotal: monto, fechasValidas: fechas, razonSocial: razonSocial.trim() },
      uiData: { linea, pedido, ruc: ruc.trim(), codigoCliente }
    };
  }, [plannerState.montoOriginal, plannerState.linea, plannerState.pedido, plannerState.selectedDates, plannerState.codigoCliente, ruc, razonSocial]);

  const calcular = useCallback(async () => {
    const { fieldErrors, generalErrors, isValid, payload, uiData } = _getAndValidateFormData();

    if (!isValid) {
      const newErrors = fieldErrors.reduce((acc, error) => {
        // Map validator field names to component IDs
        const fieldMap: Record<string, string> = {
          monto: 'montoOriginal',
          razonSocial: 'descCliente',
          ruc: 'ruc',
          pedido: 'pedido'
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

      setPlannerState(prevState => ({
        ...prevState,
        montoOriginal: payload.montoTotal,
        fechasOrdenadas: payload.fechasValidas,
        montosAsignados: resultado.montosAsignados,
        resumenMensual: resultado.resumenMensual,
        linea: uiData.linea,
        pedido: uiData.pedido,
        ruc: uiData.ruc,
        codigoCliente: uiData.codigoCliente,
        descCliente: payload.razonSocial,
        isDataDirty: false
      }));
      
      // mostrarResults(); // Now handled by React rendering
    } catch (error) {
      console.error('Error en cálculo:', error);
      // mostrarToast((error as Error).message || 'Error al realizar el cálculo', 'error');
    } finally {
      // mostrarLoading(false);
    }
  }, [_getAndValidateFormData]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // Basic validation of the loaded data
      if (data && data.montosAsignados && data.selectedDates) {
        const loadedState: PlannerState = {
          ...plannerState,
          montoOriginal: data.montoOriginal || 0,
          selectedDates: new Set(data.selectedDates || []),
          fechasOrdenadas: data.fechasOrdenadas || [],
          montosAsignados: data.montosAsignados || {},
          resumenMensual: data.resumenMensual || {},
          cliente: data.cliente || '',
          ruc: data.ruc || '',
          descCliente: data.descCliente || '',
          linea: data.linea || '',
          pedido: data.pedido || '',
          codigoCliente: data.codigoCliente || '',
          isDataDirty: false, // Loaded state is considered not dirty
        };
        setPlannerState(loadedState);
        setRuc(data.ruc || '');
        setRazonSocial(data.descCliente || '');
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
  }, [plannerState, setRuc, setRazonSocial]);

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
          const parsedState: PlannerState = JSON.parse(cachedState);
          if (Array.isArray(parsedState.selectedDates)) {
            parsedState.selectedDates = new Set(parsedState.selectedDates);
          }
          setPlannerState(parsedState);
        }
      } catch (error) {
        console.error('Error initializing PlanificadorPage:', error);
        // mostrarToast('Error al iniciar la aplicación', 'error');
      }
    };

    initializeApp();
  }, []);


  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen font-sans">
      <header className="bg-planificador-light-primary dark:bg-planificador-dark-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold">Planificador de Vencimientos</h1>
          {/* Theme toggle can be added here if needed */}
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div id="loading-overlay" style={{ display: isRucLoading ? 'flex' : 'none' }}>
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
          <SeleccionFechas
            selectedDates={plannerState.selectedDates}
            onCargarRespaldoClick={handleCargarRespaldoClick}
            fetchCalendarEvents={fetchCalendarEvents}
            handleDateClick={handleDateClick}
            handleDayCellMount={handleDayCellMount}
          />

          <DatosGeneralesPlanner
            montoOriginal={plannerState.montoOriginal}
            ruc={ruc}
            razonSocial={razonSocial}
            errors={errors}
            rucError={rucError}
            onInputChange={handleInputChange}
            onRucChange={handleRucChange}
            onRazonSocialChange={handleRazonSocialChange}
            onRucSearch={handleRucSearch}
            onCalcular={calcular}
          />

          <ResultadosPlanner
            resumenMensual={plannerState.resumenMensual}
            montoOriginal={plannerState.montoOriginal}
            montosAsignados={plannerState.montosAsignados}
            linea={plannerState.linea}
          />
        </div>
      </main>
    </div>
  );
};