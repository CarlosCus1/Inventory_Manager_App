import React, { useState, useEffect, useRef, useCallback } from 'react';

import * as DateUtils from '../utils/dateUtils';
import { calcular as calcularApi, generarReporte, generarReporteJson } from '../utils/api';
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
import { BackupOptionsModal } from '../components/planner/BackupOptionsModal';

// This could be a helper function inside PlanificadorPage or in a utility file
const readFileContent = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        resolve(data);
      } catch (e) {
        reject(new Error("Error parsing JSON file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

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
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
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
  const [fileSelectionMode, setFileSelectionMode] = useState<'loadAndEdit' | 'createCopy' | null>(null);

  // Function to fetch calendar events (holidays)
  const fetchCalendarEvents = useCallback(async (fetchInfo: { start: Date; end: Date; timeZone: string; }, successCallback: (events: []) => void, failureCallback: (error: Error) => void) => {
    try {
      const year = fetchInfo.start.getFullYear();
      console.log('Fetching holidays for year:', year);
      const feriados = await fetchHolidays(year) as Array<{ date: string; name: string }>;
      console.log('Fetched holidays:', feriados);

      feriadosCargados.current.clear();
      feriadosCargados.current.clear();
      feriados.forEach((feriado) => {
        feriadosCargados.current.set(feriado.date, feriado.name);
      });
      console.log('Feriados cargados en ref:', feriadosCargados.current);

      successCallback([]); // Pass an empty array of events to FullCalendar for holidays
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
    console.log('handleDayCellMount called for:', arg.date);
    const dateStr = DateUtils.formatearFecha(arg.date);
    
    // Apply class if the date is selected
    if (plannerState.selectedDates.has(dateStr)) {
      arg.el.classList.add('fc-day-selected');
    }

    // Apply class and tooltip if the date is a holiday
    if (feriadosCargados.current.has(dateStr)) {
      console.log('Holiday found:', dateStr, feriadosCargados.current.get(dateStr));
      arg.el.classList.add('fc-holiday');
      arg.el.setAttribute('title', feriadosCargados.current.get(dateStr) || '');
    }

    // Apply class for Sundays
    if (arg.date.getDay() === 0) {
      arg.el.classList.add('fc-day-sun');
    }

    // Apply class for Saturdays
    if (arg.date.getDay() === 6) {
      arg.el.classList.add('fc-day-sat');
    }
  }, [plannerState.selectedDates, feriadosCargados]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    actualizarFormulario('planificador', name as keyof IForm, value);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
  }, [actualizarFormulario, errors]); // Added errors to dependencies

  const handleMontoAjustadoChange = useCallback((fecha: string, nuevoMonto: string) => {
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
  }, []);

  const handleOpenBackupModal = useCallback(() => {
    setIsBackupModalOpen(true);
  }, []);

  const handleCloseBackupModal = useCallback(() => {
    setIsBackupModalOpen(false);
  }, []);

  // Function to update the state of action buttons (like 'Calcular')
  const _updateActionButtonsState = useCallback(() => {
    const monto = Number(formState.montoOriginal) || 0;
    const fechas = Array.from(plannerState.selectedDates);
    const pedido = formState.pedido_planificador?.trim() || '';
    const cliente = formState.cliente?.trim() || '';

    const isMontoValid = monto > 0;
    const areFechasValid = fechas.length > 0;
    const isClienteValid = cliente.length > 0;
    const isPedidoValid = pedido.length > 0;

    const canCalculate = isMontoValid && areFechasValid && isClienteValid && isPedidoValid;

    setCalcularDisabled(!canCalculate);

    if (btnCalcularRef.current) {
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
    }
  }, [formState, plannerState.selectedDates, setCalcularDisabled, btnCalcularRef]); // Added dependencies

  // Effect to update button state when form or selections change
  useEffect(() => {
    _updateActionButtonsState();
  }, [formState, plannerState.selectedDates, _updateActionButtonsState]); // Dependencies for useEffect

  const _getAndValidateFormData = useCallback(() => {
    const monto = Number(formState.montoOriginal) || 0;
    const ruc = formState.documento_cliente || '';
    const razonSocial = formState.cliente || '';
    const pedido = formState.pedido_planificador || '';
    const fechas = Array.from(plannerState.selectedDates);

    const { fieldErrors, generalErrors, isValid, uiData, montoTotal, fechasValidas } = FormValidator.validate({
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
      uiData: { ...formState }, // Pass all form state to uiData
      montoTotal: monto,
      fechasValidas: fechas,
      razonSocial: razonSocial.trim()
    };
  }, [formState, plannerState.selectedDates]);

  const calcular = useCallback(async () => {
      const { fieldErrors, generalErrors, isValid, uiData } = _getAndValidateFormData();

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
      const { montoTotal, fechasValidas, razonSocial } = _getAndValidateFormData();
      const resultado = await calcularApi({ ..._getAndValidateFormData().payload, ...uiData });

      // Update local state with calculation results
      setPlannerState(prevState => ({
        ...prevState,
        fechasOrdenadas: resultado.fechasValidas,
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

  const handleExportAjustado = useCallback(async (dataToExport?: any) => { // Added dataToExport parameter
    const payload = dataToExport || { // Use provided data or construct from state
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
      // Export XLSX
      const xlsxBlob = await generarReporte(payload);
      const xlsxUrl = window.URL.createObjectURL(xlsxBlob);
      const xlsxA = document.createElement('a');
      xlsxA.href = xlsxUrl;
      xlsxA.download = `planificador_${formState.cliente || 'reporte'}_${new Date().toISOString().slice(0,10)}.xlsx`; // Dynamic filename
      document.body.appendChild(xlsxA);
      xlsxA.click();
      xlsxA.remove();

      // Export JSON backup
      const jsonBlob = await generarReporteJson(payload);
      const jsonUrl = window.URL.createObjectURL(jsonBlob);
      const jsonA = document.createElement('a');
      jsonA.href = jsonUrl;
      jsonA.download = `planificador_${formState.cliente || 'reporte'}_${new Date().toISOString().slice(0,10)}.json`; // Dynamic filename
      document.body.appendChild(jsonA);
      jsonA.click();
      jsonA.remove();

    } catch (error) {
      console.error("Error al exportar:", error);
      alert("No se pudo generar el archivo de reporte. Verifique que el servidor backend esté funcionando.");
    }
  }, [formState, montosAjustados, plannerState.fechasOrdenadas, plannerState.resumenMensual]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await readFileContent(file); // Use the new utility

      if (fileSelectionMode === 'loadAndEdit') {
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
      } else if (fileSelectionMode === 'createCopy') {
        await handleExportAjustado(data); // Export directly with loaded data
      }
    } catch (error) {
      console.error('Error al cargar el respaldo:', error);
      // mostrarToast('Error al procesar el archivo de respaldo.', 'error');
    } finally {
      // Reset file input to allow loading the same file again
      if (event.target) {
        event.target.value = '';
      }
      setFileSelectionMode(null); // Reset mode after processing
    }
  }, [actualizarFormulario, fileSelectionMode, handleExportAjustado]); // Added dependencies

  const triggerFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  const handleClearSelectedDates = useCallback(() => {
    setPlannerState(prevState => ({
      ...prevState,
      selectedDates: new Set(),
      isDataDirty: true, // Mark data as dirty if dates are cleared
    }));
  }, []);

  return (
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
            onOpenBackupModal={handleOpenBackupModal}
          />

          <SeleccionFechas
            selectedDates={plannerState.selectedDates}
            fetchCalendarEvents={fetchCalendarEvents}
            handleDateClick={handleDateClick}
            handleDayCellMount={handleDayCellMount}
            onCalcular={calcular}
            isCalcularDisabled={isCalcularDisabled}
            onClearSelectedDates={handleClearSelectedDates}
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

      <BackupOptionsModal
        isOpen={isBackupModalOpen}
        onClose={handleCloseBackupModal}
        onLoadAndEdit={() => {
          setFileSelectionMode('loadAndEdit');
          triggerFileInputClick();
        }}
        onCreateIdenticalCopy={() => {
          setFileSelectionMode('createCopy');
          triggerFileInputClick();
        }}
      />
    </div>
  );
};