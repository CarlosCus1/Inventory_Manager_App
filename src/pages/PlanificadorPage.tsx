import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import * as DateUtils from '../utils/dateUtils';
import { calcular as calcularApi, generarReporte, generarReporteJson, fetchHolidays } from '../utils/api'; // Renamed calcular to calcularApi
import { MAX_FECHAS, LABELS } from '../utils/config';
import { mostrarToast, mostrarLoading, downloadFile, normalizeStringForFilename } from '../utils/uiUtils';
import { FormValidator } from '../utils/formValidator';

import { SummaryTable } from '../components/planner/SummaryTable';
import { DetailTable } from '../components/planner/DetailTable';
import { ComparisonTotals } from '../components/planner/ComparisonTotals';

import { RUCManager } from '../../modulo_planificador/public/js/rucManager.js'; // Will be refactored
import { GraficoManager } from '../../modulo_planificador/public/js/graficoManager.js'; // Will be refactored
import { FileManager } from '../../modulo_planificador/public/js/fileManager.js'; // Will be refactored
import { NavigationManager } from '../../modulo_planificador/public/js/navigationManager.js'; // Will be refactored
import { StateManager } from '../../modulo_planificador/public/js/stateManager.js'; // Will be replaced

// Import CSS files
import '../../modulo_planificador/public/css/style.css';
import '../../modulo_planificador/public/css/calendar-base.css';
import '../../modulo_planificador/public/css/calendar-custom.css';

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

  const [currentPage, setCurrentPage] = useState(0); // 0: Fechas, 1: Cliente, 2: Resultados

  const feriadosCargados = useRef(new Map<string, string>()); // Use useRef for mutable map

  // Refs for DOM elements that were previously accessed by getElementById
  const montoInputRef = useRef<HTMLInputElement>(null);
  const rucInputRef = useRef<HTMLInputElement>(null);
  const descClienteInputRef = useRef<HTMLInputElement>(null);
  const lineaInputRef = useRef<HTMLSelectElement>(null);
  const pedidoInputRef = useRef<HTMLInputElement>(null);
  const codigoClienteInputRef = useRef<HTMLInputElement>(null);
  const btnCalcularRef = useRef<HTMLButtonElement>(null);
  const btnDescargarReportesRef = useRef<HTMLButtonElement>(null);
  const btnActualizarCalculosRef = useRef<HTMLButtonElement>(null);
  const btnCargarRespaldoRef = useRef<HTMLButtonElement>(null);
  const btnReiniciarTareaRef = useRef<HTMLButtonElement>(null);
  const themeToggleRef = useRef<HTMLDivElement>(null);
  const recalculateContainerRef = useRef<HTMLDivElement>(null);
  const btnRecalculateRef = useRef<HTMLButtonElement>(null);
  const calendarioContainerRef = useRef<HTMLDivElement>(null);
  const listaFechasUlRef = useRef<HTMLUListElement>(null);
  const contadorFechasSpanRef = useRef<HTMLSpanElement>(null);
  const rucErrorRef = useRef<HTMLSpanElement>(null);
  const rucLoadingRef = useRef<HTMLDivElement>(null);
  const rucResultRef = useRef<HTMLDivElement>(null);
  const razonSocialManualMessageRef = useRef<HTMLSpanElement>(null);
  const errorMontoRef = useRef<HTMLSpanElement>(null);
  const errorPedidoRef = useRef<HTMLSpanElement>(null);
  const errorDescClienteRef = useRef<HTMLSpanElement>(null);

  // Placeholder for UIUtils.mostrarToast
  const mostrarToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    console.log(`Toast (${type}): ${message}`);
    // In a real app, you would render a toast component here
  }, []);

  // Function to fetch calendar events (holidays)
  const fetchCalendarEvents = useCallback(async (fetchInfo: any, successCallback: (events: any[]) => void, failureCallback: (error: any) => void) => {
    try {
      const year = fetchInfo.start.getFullYear();
      const feriados = await fetchHolidays(year);

      feriadosCargados.current.clear();
      feriados.forEach(feriado => {
        feriadosCargados.current.set(feriado.date, feriado.name);
      });

      successCallback([]); // Return empty array for events, as styling is handled by dayCellDidMount
    } catch (error) {
      console.error('Error al cargar eventos del calendario:', error);
      mostrarToast('No se pudieron cargar los feriados.', 'error');
      failureCallback(error);
    }
  }, [feriadosCargados, mostrarToast]);

  const handleDateClick = useCallback((arg: any) => {
    const dateStr = DateUtils.formatearFecha(arg.date);
    const isHoliday = feriadosCargados.current.has(dateStr);
    const isSunday = arg.date.getDay() === 0;

    if (DateUtils.esPasado(arg.date) || isSunday || isHoliday) {
      mostrarToast('No se pueden seleccionar domingos, feriados o días pasados.', 'info');
      return;
    }

    setPlannerState(prevState => {
      const newSelectedDates = new Set(prevState.selectedDates);
      if (newSelectedDates.has(dateStr)) {
        newSelectedDates.delete(dateStr);
      } else {
        if (newSelectedDates.size >= MAX_FECHAS) {
          mostrarToast(`Máximo ${MAX_FECHAS} fechas permitidas`, 'error');
          return prevState; // Return previous state if max dates reached
        }
        newSelectedDates.add(dateStr);
      }
      // No direct classList manipulation here, React will re-render based on state
      return { ...prevState, selectedDates: newSelectedDates };
    });

    // handleFormChange will be called by a useEffect that watches plannerState
    // actualizarListaFechas will be called by a useEffect that watches plannerState.selectedDates
  }, [feriadosCargados, mostrarToast, MAX_FECHAS]);

  const handleDayCellMount = useCallback((arg: any) => {
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
  }, [plannerState.selectedDates, feriadosCargados]);

  // Placeholder for FullCalendar initialization
  const initCalendar = useCallback(() => {
    if (calendarioContainerRef.current) {
      console.log('Initializing FullCalendar...');
      const calendar = new FullCalendar.Calendar(calendarioContainerRef.current, {
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

  const toggleRecalculateButton = useCallback((show: boolean) => {
    if (recalculateContainerRef.current) {
      recalculateContainerRef.current.style.display = show ? 'block' : 'none';
    }
    if (btnDescargarReportesRef.current) {
      btnDescargarReportesRef.current.disabled = show;
    }
  }, []);

  const _updateActionButtonsState = useCallback(() => {
    const monto = parseFloat(montoInputRef.current?.value || '0');
    const fechas = Array.from(plannerState.selectedDates);
    const razonSocial = descClienteInputRef.current?.value.trim() || '';
    const pedido = pedidoInputRef.current?.value.trim() || '';

    if (!btnCalcularRef.current) return;

    const isMontoValid = monto > 0;
    const areFechasValid = fechas.length > 0;
    const isClienteValid = razonSocial.length > 0;
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
  }, [plannerState.selectedDates]);

  const handleFormChange = useCallback(() => {
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
    toggleRecalculateButton(true);
    _updateActionButtonsState();
  }, [toggleRecalculateButton, _updateActionButtonsState]);

  const _getValidationData = useCallback(() => {
    const monto = parseFloat(montoInputRef.current?.value || '0');
    const fechas = Array.from(plannerState.selectedDates);
    const razonSocial = descClienteInputRef.current?.value.trim() || '';
    const pedido = pedidoInputRef.current?.value.trim() || '';

    return { monto, fechas, razonSocial, pedido };
  }, [plannerState.selectedDates]);

  const _getAndValidateFormData = useCallback(() => {
    const monto = parseFloat(montoInputRef.current?.value || '0');
    const ruc = rucInputRef.current?.value.trim() || '';
    const linea = lineaInputRef.current?.value || '';
    const pedido = pedidoInputRef.current?.value.value || '';
    const fechas = Array.from(plannerState.selectedDates);
    const razonSocial = descClienteInputRef.current?.value.trim() || '';
    const codigoCliente = codigoClienteInputRef.current?.value.trim() || '';

    const { fieldErrors, generalErrors, isValid } = FormValidator.validate({
      monto,
      fechas,
      ruc,
      razonSocial,
      pedido
    });

    return {
      fieldErrors,
      generalErrors,
      isValid,
      payload: { montoTotal: monto, fechasValidas: fechas, razonSocial },
      uiData: { linea, pedido, ruc, codigoCliente }
    };
  }, [plannerState.selectedDates]);

  const calcular = useCallback(async () => {
    const { fieldErrors, generalErrors, isValid, payload, uiData } = _getAndValidateFormData();

    if (!isValid) {
      mostrarToast(generalErrors.join(' | '), 'error');
      // Display field errors
      if (errorMontoRef.current) errorMontoRef.current.textContent = fieldErrors.find(e => e.field === 'monto')?.message || '';
      if (rucErrorRef.current) rucErrorRef.current.textContent = fieldErrors.find(e => e.field === 'ruc')?.message || '';
      if (errorDescClienteRef.current) errorDescClienteRef.current.textContent = fieldErrors.find(e => e.field === 'desc-cliente')?.message || '';
      if (errorPedidoRef.current) errorPedidoRef.current.textContent = fieldErrors.find(e => e.field === 'pedido')?.message || '';
      return;
    }
    
    try {
      mostrarLoading(true, 'Calculando distribución...');
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
      toggleRecalculateButton(false);
      setCurrentPage(2); // Go to results page
    } catch (error: any) {
      console.error('Error en cálculo:', error);
      mostrarToast(error.message || 'Error al realizar el cálculo', 'error');
    } finally {
      mostrarLoading(false);
    }
  }, [_getAndValidateFormData, mostrarToast, mostrarLoading, toggleRecalculateButton, setCurrentPage]);

  const recalcular = useCallback(async () => {
    await calcular();
  }, [calcular]);

  const generarAmbosReportes = useCallback(async () => {
    if (plannerState.isDataDirty) {
      mostrarToast('Hay cambios sin calcular. Por favor, actualice el cálculo antes de descargar los reportes.', 'warning');
      return;
    }
  
    mostrarLoading(true, 'Generando reportes...');
    try {
      const reportData = {
        montoOriginal: plannerState.montoOriginal,
        fechasOrdenadas: Array.from(plannerState.selectedDates), // Convert Set to Array
        montosAsignados: plannerState.montosAsignados,
        resumenMensual: plannerState.resumenMensual,
        razonSocial: plannerState.descCliente,
        ruc: plannerState.ruc,
        linea: plannerState.linea,
        pedido: plannerState.pedido,
        codigoCliente: plannerState.codigoCliente
      };
      const baseFilename = `${DateUtils.formatearMesAnioParaFilename(new Date())}-${normalizeStringForFilename(plannerState.pedido)}-${normalizeStringForFilename(plannerState.descCliente)}`; // Use normalizeStringForFilename

      // Generate and download Excel report
      const excelBlob = await generarReporte(reportData);
      const excelFilename = `reporte_${baseFilename}.xlsx`;
      downloadFile(excelBlob, excelFilename);
      mostrarToast('Reporte Excel generado correctamente', 'success');

      // Generate and download JSON report
      const jsonBlob = await generarReporteJson(reportData);
      const jsonFilename = `respaldo_${baseFilename}.json`;
      downloadFile(jsonBlob, jsonFilename);
      mostrarToast('Respaldo JSON generado correctamente', 'success');

      // Clear local storage after successful report download
      localStorage.removeItem('planificadorAppData');
      setPlannerState({ // Reset plannerState to initial values
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

    } catch (error: any) {
      console.error('Error generando reportes:', error);
      mostrarToast(error.message || 'Error al generar uno o ambos reportes', 'error');
    } finally {
      mostrarLoading(false);
    }
  }, [plannerState, mostrarToast, mostrarLoading, downloadFile]);

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

        // Update UI elements based on loaded state (using refs)
        if (montoInputRef.current) montoInputRef.current.value = plannerState.montoOriginal.toString();
        if (rucInputRef.current) rucInputRef.current.value = plannerState.ruc;
        if (descClienteInputRef.current) descClienteInputRef.current.value = plannerState.descCliente;
        if (lineaInputRef.current) lineaInputRef.current.current.value = plannerState.linea || 'otros';
        if (pedidoInputRef.current) pedidoInputRef.current.value = plannerState.pedido;
        if (codigoClienteInputRef.current) codigoClienteInputRef.current.value = plannerState.codigoCliente;

        // Re-render calendar and selected dates list (will be handled by React state)
        // actualizarListaFechas(Array.from(plannerState.selectedDates));
        // if (Object.keys(plannerState.montosAsignados).length > 0) {
        //     mostrarResults();
        // }
        // toggleRecalculateButton(plannerState.isDataDirty);

        // setupEventListeners will be handled by React's event system
        // _updateActionButtonsState will be a derived state or effect
      } catch (error) {
        console.error('Error initializing PlanificadorPage:', error);
        mostrarToast('Error al iniciar la aplicación', 'error');
      }
    };

    initializeApp();
  }, [initCalendar, plannerState, mostrarToast]); // Add plannerState to dependencies to update UI on state change

  // Effect to update the list of selected dates whenever plannerState.selectedDates changes
  useEffect(() => {
    const fechasArray = Array.from(plannerState.selectedDates);
    if (listaFechasUlRef.current && contadorFechasSpanRef.current) {
      fechasArray.sort((a, b) => DateUtils.parsearFecha(a).getTime() - DateUtils.parsearFecha(b).getTime());

      listaFechasUlRef.current.innerHTML = ''; // Clear existing list
      fechasArray.forEach(fecha => {
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
        const li = document.createElement('li');
        li.textContent = `${fecha}${textoDias}`;
        listaFechasUlRef.current?.appendChild(li);
      });

      contadorFechasSpanRef.current.textContent = `(${fechasArray.length})`;
    }
  }, [plannerState.selectedDates]);

  return (
    <>
      <div className="banner-container" title="Desarrollado por Carlos Cusi, con la asistencia de Gemini.">
        <p id="banner-status-text">Planificador de Vencimientos v2.1</p>
      </div>
      <header>
        <div className="header-container">
          <h1 className="main-title">Planificador de Vencimientos</h1>
          {/* Interruptor de Tema Mejorado */}
          <div id="theme-toggle" role="switch" aria-checked="false" aria-label="Cambiar tema" tabIndex={0} ref={themeToggleRef}>
            <div className="toggle-thumb">
              <span className="icon sun"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h3.75a.75.75 0 01.75.75zM18 12a.75.75 0 01-.75.75h-3.75a.75.75 0 010-1.5h3.75a.75.75 0 01.75.75zM12 18a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3a.75.75 0 01.75-.75zM12 6a6 6 0 110 12 6 6 0 010-12zM4.929 4.929a.75.75 0 011.06 0l1.591 1.59a.75.75 0 01-1.061 1.06l-1.59-1.59a.75.75 0 010-1.061zm12.021 0a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.061-1.06l1.59-1.59a.75.75 0 011.061 0zm-1.06 12.021a.75.75 0 01-1.06 0l-1.59-1.59a.75.75 0 011.06-1.061l1.591 1.59a.75.75 0 010 1.061zm-12.021 0a.75.75 0 010-1.06l1.59-1.59a.75.75 0 011.061 1.06l-1.59 1.59a.75.75 0 01-1.061 0z" /></svg></span>
              <span className="icon moon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.855 11.154 11.154 0 00-3.91 7.647c0 4.935 3.993 8.928 8.928 8.928a11.154 11.154 0 007.647-3.91.75.75 0 01.855.162 8.25 8.25 0 11-13.92-8.928 8.25 8.25 0 013.91-7.647z" clipRule="evenodd" /></svg></span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="progress-indicator">
          <div className={`step ${currentPage === 0 ? 'active' : ''}`} data-step="0" title="Ir a la selección de fechas" onClick={() => setCurrentPage(0)}><span>1</span> Fechas</div>
          <div className={`step ${currentPage === 1 ? 'active' : ''}`} data-step="1" title="Ir a los datos del cliente" onClick={() => setCurrentPage(1)}><span>2</span> Cliente</div>
          <div className={`step ${currentPage === 2 ? 'active' : ''}`} data-step="2" title="Ir a los resultados" onClick={() => setCurrentPage(2)}><span>3</span> Resultados</div>
        </div>

        <div id="loading-overlay" ref={rucLoadingRef}> {/* Reusing rucLoadingRef for general loading overlay */}
          <div className="spinner"></div>
          <p id="loading-message">Cargando...</p>
        </div>

        <div id="toast-container"></div>

        {/* Sección 1: Selección de Fechas */}
        <section id="seleccion-fechas" className={`page ${currentPage === 0 ? 'active' : ''}`}>
          <h2>Selección de Fechas</h2>
          <div id="calendario-container" ref={calendarioContainerRef}></div>
          
          <div className="fechas-seleccionadas">
            <div className="fechas-header">
              <h3>Fechas Seleccionadas <span id="contador-fechas" ref={contadorFechasSpanRef}>(0)</span></h3>
            </div>
            <ul id="lista-fechas" ref={listaFechasUlRef}>
              {plannerState.fechasOrdenadas.map(fecha => {
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
                return <li key={fecha}>{`${fecha}${textoDias}`}</li>;
              })}
            </ul>
          </div>
          
          <div className="form-actions">
            <button type="button" id="btn-cargar-respaldo" className="btn-secondary" ref={btnCargarRespaldoRef}>Cargar Respaldo</button>
            <button type="button" id="btn-reiniciar-tarea" className="btn-primary large-button" ref={btnReiniciarTareaRef}>Empezar de Nuevo</button>
          </div>
        </section>

        {/* Sección 2: Datos del Cliente */}
        <section id="datos-cliente" className={`page ${currentPage === 1 ? 'active' : ''}`}>
          <h2>Datos del Cliente</h2>
          <form id="formulario-cliente">
            <div className="form-group">
              <label htmlFor="monto">Monto Total (S/)</label>
              <input type="number" id="monto" step="0.01" min="0" required ref={montoInputRef} />
              <span className="error-message" id="error-monto" ref={errorMontoRef}></span>
            </div>
            
            <div className="form-group">
              <label htmlFor="ruc">RUC</label>
              <input type="text" id="ruc" maxLength={11} pattern="\d{11}" required ref={rucInputRef} />
              <span className="error-message" id="error-ruc" ref={rucErrorRef}></span>
              <div id="ruc-loading" className="loading-indicator" hidden ref={rucLoadingRef}> {/* This ref is duplicated, will need to be handled */}
                <div className="spinner"></div>
                <span>Buscando RUC...</span>
              </div>
              <div id="ruc-result" className="ruc-result" hidden ref={rucResultRef}></div>
            </div>
            
            <div className="form-group">
              <label htmlFor="desc-cliente">Razón Social</label>
              <input type="text" id="desc-cliente" ref={descClienteInputRef} />
              <span className="error-message" id="error-desc-cliente" ref={errorDescClienteRef}></span>
              <span className="info-message" id="manual-razon-social-message" hidden ref={razonSocialManualMessageRef}></span>
            </div>

            <div className="form-group">
              <label htmlFor="codigo-cliente">Código de Cliente (Opcional)</label>
              <input type="text" id="codigo-cliente" maxLength={20} ref={codigoClienteInputRef} />
            </div>

            <div className="form-group">
              <label htmlFor="linea">Línea</label>
              <select id="linea" required ref={lineaInputRef}>
                <option value="viniball">Viniball</option>
                <option value="vinifan">Vinifan</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pedido">Código de Pedido (Requerido)</label>
              <input type="text" id="pedido" maxLength={50} required ref={pedidoInputRef} />
              <span className="error-message" id="error-pedido" ref={errorPedidoRef}></span>
            </div>
            
            <div className="form-actions">
              <button type="button" id="btn-calcular" className="btn-primary" ref={btnCalcularRef}>Calcular</button>
            </div>
          </form>
        </section>

        {/* Sección 3: Resultados */}
        <section id="resultados" className={`page ${currentPage === 2 ? 'active' : ''}`}>
          <h2>Results</h2>
          <div className="results-layout">
            <div className="results-top-section">
              <SummaryTable
                resumenMensual={plannerState.resumenMensual}
                montoOriginal={plannerState.montoOriginal}
              />
              <ComparisonTotals
                montoOriginal={plannerState.montoOriginal}
                montosAsignados={plannerState.montosAsignados}
              />
            </div>
            <DetailTable
              montosAsignados={plannerState.montosAsignados}
            />
            <div className="results-chart-section">
              <h3>Resumen Mensual</h3>
              <canvas id="grafico-resumen"></canvas> {/* Chart.js will render here */}
              </div>
            </div>
          </div>
          <div id="recalculate-container" style={{ display: 'none' }} ref={recalculateContainerRef}>
            <p>Los datos han cambiado. Por favor, actualice el cálculo.</p>
            <button type="button" id="btn-recalculate" className="btn-primary" ref={btnRecalculateRef}>Actualizar Cálculo</button>
          </div>
          <div className="form-actions">
            <button type="button" id="btn-actualizar-calculos" className="btn-secondary" ref={btnActualizarCalculosRef}>Reiniciar Cálculo</button>
            <button type="button" id="btn-descargar-reportes" className="btn-primary" ref={btnDescargarReportesRef}>Descargar Reportes</button>
            <button type="button" id="btn-reiniciar" className="btn-secondary">Empezar de Nuevo</button>
          </div>
        </section>
      </main>
    </>
  );
};