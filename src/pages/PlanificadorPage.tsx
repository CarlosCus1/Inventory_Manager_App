import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import * as DateUtils from '../utils/dateUtils';
import { calcular as calcularApi } from '../utils/api'; // Renamed calcular to calcularApi
import { MAX_FECHAS } from '../utils/config';
import { FormValidator } from '../utils/formValidator';

import { SummaryTable } from '../components/planner/SummaryTable';
import { DetailTable } from '../components/planner/DetailTable';
import { ComparisonTotals } from '../components/planner/ComparisonTotals';
import { useAppStore } from '../store/useAppStore';
import { SummaryChart } from '../components/planner/SummaryChart';
import { useRucManager } from '../hooks/useRucManager';
import { StyledInput } from '../components/ui/StyledInput';
import { FormGroup, Label } from '../components/ui/FormControls';
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
  const calendarioContainerRef = useRef<HTMLDivElement>(null);

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

  // Placeholder for FullCalendar initialization
  const initCalendar = useCallback(() => {
    if (calendarioContainerRef.current) {
      console.log('Initializing FullCalendar...');
      const calendar = new (FullCalendar as any).Calendar(calendarioContainerRef.current, {
        plugins: [dayGridPlugin, interactionPlugin],
        locale: 'es',
        initialView: 'dayGridMonth',
        height: 'auto',
        fixedWeekCount: true,
        headerToolbar: {
          left: 'prev,today,next',
          center: 'title',
          right: ''
        },
        buttonText: {
          today: 'Hoy'
        },
        eventSources: [
          {
            events: fetchCalendarEvents // Use the new fetchCalendarEvents useCallback
          }
        ],
        dateClick: handleDateClick, // Use the new handleDateClick useCallback
        dayCellDidMount: handleDayCellMount // Use the new handleDayCellMount useCallback
      });
      calendar.render();
    }
  }, [feriadosCargados, fetchCalendarEvents, handleDateClick, handleDayCellMount]);

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

        // Migrate initComponents logic here
        initCalendar(); // Initialize calendar

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
  }, [initCalendar]);


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
          {/* Sección 1: Selección de Fechas */}
          <section id="seleccion-fechas" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-planificador-light-primary dark:text-planificador-dark-primary">1. Selección de Fechas</h2>
            <div id="calendario-container" ref={calendarioContainerRef} className="mb-4 w-full overflow-x-auto"></div>
            
            <div className="fechas-seleccionadas">
              <h3 className="text-lg font-semibold mb-2">Fechas Seleccionadas ({plannerState.selectedDates.size})</h3>
              <ul className="max-h-48 overflow-y-auto border rounded-md p-2">
                {Array.from(plannerState.selectedDates)
                  .sort((a, b) => DateUtils.parsearFecha(a).getTime() - DateUtils.parsearFecha(b).getTime())
                  .map(fecha => {
                    const diasRestantes = DateUtils.diasDesdeHoy(fecha);
                    let textoDias = '';
                    switch (diasRestantes) {
                        case 0: textoDias = ' (Hoy)'; break;
                        case 1: textoDias = ' (Mañana)'; break;
                        case -1: textoDias = ' (Ayer)'; break;
                        default:
                            if (diasRestantes > 1) {
                                textoDias = ` (en ${diasRestantes} días)`;
                            } else {
                                textoDias = ` (hace ${Math.abs(diasRestantes)} días)`;
                            }
                            break;
                    }
                    return <li key={fecha} className="py-1 border-b last:border-b-0">{`${fecha}${textoDias}`}</li>;
                })}
              </ul>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleCargarRespaldoClick}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cargar Respaldo
              </button>
            </div>
          </section>

          {/* Sección 2: Datos del Cliente */}
          <section id="datos-cliente" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-planificador-light-primary dark:text-planificador-dark-primary">2. Datos del Cliente</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <FormGroup>
                <Label htmlFor="montoOriginal">Monto Total (S/)</Label>
                <StyledInput
                  id="montoOriginal"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={plannerState.montoOriginal === 0 ? '' : String(plannerState.montoOriginal)}
                  onChange={handleInputChange}
                  variant="planificador"
                  className="input-module-planificador"
                />
                 {/* TODO: Implement error display logic if needed */}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="ruc">RUC</Label>
                <StyledInput
                  id="ruc"
                  type="text"
                  maxLength={11}
                  pattern="\d{11}"
                  required
                  value={ruc}
                  onChange={handleRucChange}
                  onBlur={handleRucSearch}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  variant="planificador"
                  className="input-module-planificador"
                />
                 {/* TODO: Implement error display logic for rucError and errors.ruc */}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="descCliente">Razón Social</Label>
                <StyledInput
                  id="descCliente"
                  type="text"
                  required
                  value={razonSocial}
                  onChange={handleRazonSocialChange}
                  variant="planificador"
                  className="input-module-planificador"
                />
                 {/* TODO: Implement error display logic for errors.descCliente */}
              </FormGroup>

              {/* Other form fields with similar styling */}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={calcular}
                  className="bg-planificador-light-primary hover:bg-planificador-dark-secondary text-white font-bold py-2 px-4 rounded-lg"
                >
                  Calcular
                </button>
              </div>
            </form>
          </section>

          {/* Sección 3: Resultados */}
          <section id="resultados" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-planificador-light-primary dark:text-planificador-dark-primary">3. Resultados</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SummaryTable
                resumenMensual={plannerState.resumenMensual}
                montoOriginal={plannerState.montoOriginal}
              />
              <ComparisonTotals
                montoOriginal={plannerState.montoOriginal}
                montosAsignados={plannerState.montosAsignados}
              />
              <div className="lg:col-span-2">
                <DetailTable
                  montosAsignados={plannerState.montosAsignados}
                />
              </div>
              <div className="lg:col-span-2">
                <SummaryChart
                    resumenMensual={plannerState.resumenMensual}
                    montoTotalGeneral={plannerState.montoOriginal}
                    linea={plannerState.linea}
                />
              </div>
            </div>
            {/* Recalculate and download buttons */}
          </section>
        </div>
      </main>
    </div>
  );
};