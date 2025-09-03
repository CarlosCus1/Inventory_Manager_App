import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CollapsiblePanel } from '../components/ui/CollapsiblePanel';

import { useAppStore } from '../store/useAppStore';
import type { IForm } from '../interfaces';
import { useRucDni } from '../hooks/useRucDni';
import { DatosGeneralesForm } from "../components/DatosGeneralesForm";
import './PlanificadorPage.css';
import PageHeader from '../components/PageHeader';
import { BackupOptionsModal } from '../components/planner/BackupOptionsModal';


// This could be a helper function inside PlanificadorPage or in a utility file
// const readFileContent = async (file: File) => { // Commented out
//   return new Promise<Record<string, unknown>>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const data = JSON.parse(event.target?.result as string);
//         resolve(data);
//       } catch {
//         reject(new Error("Error parsing JSON file."));
//       }
//     };
//     reader.onerror = (error) => reject(error);
//     reader.readAsText(file);
//   });
// };

// Define initial state interface (for better type safety)
// This local state only holds data not related to the form itself.
interface PlannerState {
  isDataDirty: boolean;
}

export const PlanificadorPage: React.FC = () => {
  const [plannerState, setPlannerState] = useState<PlannerState>({
    isDataDirty: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // const [montosAjustados, setMontosAjustados] = useState<Record<string, number>>({}); // Commented out
  // const [montosAjustadosStr, setMontosAjustadosStr] = useState<Record<string, string>>({}); // Commented out
  // const [holidays, setHolidays] = useState<Map<string, string>>(new Map()); // Commented out
  // const [isCalcularDisabled, setCalcularDisabled] = useState(true); // Commented out
  
  
  
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const formState = useAppStore(state => state.formState.planificador);
  const actualizarFormulario = useAppStore(state => state.actualizarFormulario);

  const {
    isLoadingRuc,
  } = useRucDni('planificador');

  const fileInputRef = useRef<HTMLInputElement>(null); // btnCalcularRef commented out
  const [fileSelectionMode, setFileSelectionMode] = useState<'loadAndEdit' | 'createCopy' | null>(null);

  // const fetchHolidaysAction = useAppStore(state => state.fetchHolidays); // Commented out
  // const fetchHolidaysRef = useRef(fetchHolidaysAction); // Commented out

  // useEffect(() => { // Commented out
  //   fetchHolidaysRef.current = fetchHolidaysAction;
  // }, [fetchHolidaysAction]);

  // Function to fetch calendar events (holidays) // Commented out
  // const fetchCalendarEvents = useCallback(async (fetchInfo: { start: Date; end: Date; timeZone: string; }, successCallback: (events: Array<{ date: string; name: string }>) => void, failureCallback: (error: Error) => void) => {
  //   try {
  //       const year = fetchInfo.start.getFullYear();        
  //       const feriadosArray = await fetchHolidaysRef.current(year) as Array<{ date: string; name: string }>;
  //       const newHolidays = new Map<string, string>();
        
        
  //       // The API returns dates in "DD/MM/YYYY" format, which is what we need.
  //       feriadosArray.forEach((feriado) => {
  //           newHolidays.set(feriado.date, feriado.name);
  //       });
  //       // Compare newHolidays with current holidays to prevent unnecessary state updates
  //       let holidaysChanged = false;
  //       if (newHolidays.size !== holidays.size) {
  //           holidaysChanged = true;
  //       } else {
  //           for (const [key, value] of newHolidays) {
  //               if (holidays.get(key) !== value) {
  //                   holidaysChanged = true;
  //                   break;
  //               }
  //           }
  //       }

  //       if (holidaysChanged) {
  //           setHolidays(newHolidays);
  //       }

  //       successCallback(feriadosArray); // Pass the actual feriadosArray to successCallback
  //   } catch (error) {
  //       console.error('Error al cargar eventos del calendario:', error);
  //       failureCallback(error as Error);
  //   }
  // }, [holidays]);

  // const handleDateClick = useCallback((arg: DateClickArg) => { // Commented out
  //   const dateStr = DateUtils.formatearFecha(arg.date);
  //   const isHoliday = holidays.has(dateStr);
  //   const isSunday = arg.date.getDay() === 0;

  //   if (DateUtils.esPasado(arg.date)) {
  //     addToast(messages.pastDateError, 'error');
  //     return;
  //   }
  //   if (isSunday) {
  //     addToast(messages.sundayError, 'error');
  //     return;
  //   }
  //   if (isHoliday) {
  //     addToast(messages.holidayError(holidays.get(dateStr)!), 'error');
  //     return;
  //   }

  //   setPlannerState(prevState => {
  //     const dateStr = DateUtils.formatearFecha(arg.date);
  //     const newSelectedDates = new Set(prevState.selectedDates);
  //     if (newSelectedDates.has(dateStr)) {
  //       newSelectedDates.delete(dateStr);
  //     } else {
  //       if (newSelectedDates.size >= MAX_FECHAS) {
  //         return prevState;
  //       }
  //       newSelectedDates.add(dateStr);
  //     }
  //     return { ...prevState, selectedDates: newSelectedDates, isDataDirty: true };
  //   });
  // }, [holidays, addToast]);

  // const handleDayCellMount = useCallback((arg: DayCellContentArg) => { // Commented out
  //   const dateStr = DateUtils.formatearFecha(arg.date);

  //   if (holidays.has(dateStr)) {
  //     arg.el.classList.add('fc-holiday');
  //     arg.el.setAttribute('title', holidays.get(dateStr) || '');
  //   }

  //   if (arg.date.getDay() === 0) {
  //     arg.el.classList.add('fc-day-sun');
  //   }

  //   if (arg.date.getDay() === 6) {
  //     arg.el.classList.add('fc-day-sat');
  //   }
  // }, [holidays]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    actualizarFormulario('planificador', name as keyof IForm, value);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
  }, [actualizarFormulario, errors]); // Added errors to dependencies

  // const handleMontoAjustadoChange = useCallback((fecha: string, nuevoMonto: string) => { // Commented out
  //   // Update the string representation directly
  //   setMontosAjustadosStr(prev => ({
  //     ...prev,
  //     [fecha]: nuevoMonto,
  //   }));

  //   // Update the numeric value for calculations, handling empty strings or partial numbers
  //   const montoNumerico = parseFloat(nuevoMonto);
  //   setMontosAjustados(prev => ({
  //     ...prev,
  //     [fecha]: isNaN(montoNumerico) ? 0 : montoNumerico,
  //   }));

  //   setPlannerState(prevState => ({ ...prevState, isDataDirty: true }));
  // }, []);

  const handleOpenBackupModal = useCallback(() => {
    setIsBackupModalOpen(true);
  }, []);

  const handleCloseBackupModal = useCallback(() => {
    setIsBackupModalOpen(false);
  }, []);

  // Function to update the state of action buttons (like 'Calcular') // Commented out
  // const _updateActionButtonsState = useCallback(() => {
  //   const monto = Number(formState.montoOriginal) || 0;
  //   const fechas = Array.from(plannerState.selectedDates);
  //   const pedido = formState.pedido_planificador?.trim() || '';
  //   const cliente = formState.cliente?.trim() || '';

  //   const isMontoValid = monto > 0;
  //   const areFechasValid = fechas.length > 0;
  //   const isClienteValid = cliente.length > 0;
  //   const isPedidoValid = pedido.length > 0;

  //   const canCalculate = isMontoValid && areFechasValid && isClienteValid && isPedidoValid;

  //   setCalcularDisabled(!canCalculate);

  //   if (btnCalcularRef.current) {
  //     if (!canCalculate) {
  //       const tooltips = [];
  //       if (!isMontoValid) tooltips.push('Ingrese un monto válido.');
  //       if (!areFechasValid) tooltips.push('Seleccione al menos una fecha.');
  //       if (!isClienteValid) tooltips.push('Ingrese la razón social del cliente.');
  //       if (!isPedidoValid) tooltips.push('Ingrese el código del pedido.');
  //       btnCalcularRef.current.title = tooltips.join(' ');
  //     } else {
  //       btnCalcularRef.current.title = 'Realizar el cálculo de distribución';
  //     }
  //   }
  // }, [formState, plannerState.selectedDates, setCalcularDisabled, btnCalcularRef]); // Added dependencies

  // Effect to update button state when form or selections change // Commented out
  // useEffect(() => {
  //   _updateActionButtonsState();
  // }, [formState, plannerState.selectedDates, _updateActionButtonsState]); // Dependencies for useEffect

  // const _getAndValidateFormData = useCallback(() => { // Commented out
  //   const monto = Number(formState.montoOriginal) || 0;
  //   const ruc = formState.documento_cliente || '';
  //   const razonSocial = formState.cliente || '';
  //   const pedido = formState.pedido_planificador || '';
  //   const fechas = Array.from(plannerState.selectedDates);

  //   const validationResult = FormValidator.validate({
  //     monto,
  //     fechas,
  //     ruc: ruc.trim(),
  //     razonSocial: razonSocial.trim(),
  //     pedido: pedido.trim()
  //   });
  //   const fieldErrors = validationResult?.fieldErrors || [];
  //   const generalErrors = validationResult?.generalErrors || [];
  //   const isValid = validationResult?.isValid || false;

  //   return {
  //     fieldErrors,
  //     generalErrors,
  //     isValid,
  //     uiData: { ...formState }, // Pass all form state to uiData
  //     montoTotal: monto,
  //     fechasValidas: fechas,
  //     razonSocial: razonSocial.trim()
  //   };
  // }, [formState, plannerState.selectedDates]);

  // const calcular = useCallback(async () => { // Commented out
  //     const { fieldErrors, generalErrors, isValid, montoTotal, fechasValidas, razonSocial } = _getAndValidateFormData();

  //   if (!isValid) {
  //     const newErrors = fieldErrors.reduce((acc, error) => {
  //       // Map validator field names to component IDs
  //       const fieldMap: Record<string, string> = {
  //         monto: 'montoOriginal',
  //         razonSocial: 'cliente',
  //         ruc: 'documento_cliente',
  //         pedido: 'pedido_planificador'
  //       };
  //       const componentId = fieldMap[error.field] || error.field;
  //       acc[componentId] = error.message;
  //       return acc;
  //     }, {} as Record<string, string>);
  //     setErrors(newErrors);

  //     if (generalErrors.length > 0) {
  //       addToast(generalErrors.join('\n'), 'error');
  //     }
  //     return;
  //   }
    
  //   setErrors({}); // Clear errors on successful validation

  //   try {
  //     // mostrarLoading(true, 'Calculando distribución...');
  //     const resultado = await calcularApi({ montoTotal, fechasValidas, razonSocial });

  //     // Update local state with calculation results
  //     setPlannerState(prevState => ({
  //       ...prevState,
  //       fechasOrdenadas: fechasValidas,
  //       montosAsignados: resultado.montosAsignados,
  //       resumenMensual: resultado.resumenMensual,
  //       isDataDirty: false
  //     }));
  //     // Initialize adjusted amounts with the calculated ones
  //     const montosStr = Object.entries(resultado.montosAsignados).reduce((acc, [key, value]) => {
  //       acc[key] = value.toFixed(2);
  //       return acc;
  //     }, {} as Record<string, string>);
  //     setMontosAjustados(resultado.montosAsignados);
  //     setMontosAjustadosStr(montosStr);
  //   } catch (error) {
  //     console.error('Error en cálculo:', error);
  //     // mostrarToast((error as Error).message || 'Error al realizar el cálculo', 'error');
  //   } finally {
  //     // mostrarLoading(false);
  //   }
  // }, [_getAndValidateFormData, addToast]);

  // const handleClearModule = useCallback(() => { // Commented out
  //   setPlannerState({
  //     // selectedDates: new Set([]), // Commented out
  //     // fechasOrdenadas: [], // Commented out
  //     // montosAsignados: {} as Record<string, number>, // Commented out
  //     // resumenMensual: {} as Record<string, number>, // Commented out
  //     isDataDirty: false,
  //   });
  //   setErrors({});
  //   // setMontosAjustados({} as Record<string, number>); // Commented out
  //   // setCalcularDisabled(true); // Commented out
  //   // Clear global form state for planificador
  //   const formFieldsToClear: Array<keyof IForm> = ['montoOriginal', 'cliente', 'documento_cliente', 'codigo_cliente', 'sucursal', 'pedido_planificador', 'linea_planificador_color'];
  //   // formFieldsToClear.forEach(field => { // Commented out
  //   //   actualizarFormulario('planificador', field, ''); // Assuming empty string is the default clear value
  //   // });
  //   // Optionally clear calendar selections or reset calendar view if needed
  // }, [actualizarFormulario]);

  // const handleExportAjustado = useCallback(async (dataToExport?: Record<string, unknown>) => { // Added dataToExport parameter // Commented out
  //   const cleanPayload = {
  //     tipo: 'planificador',
  //     form: {
  //       linea_planificador_color: String(formState.linea_planificador_color || ''),
  //     },
  //     list: [],
  //     montosAsignados: { ...montosAjustados },
  //     fechasOrdenadas: [...plannerState.fechasOrdenadas],
  //     resumenMensual: { ...plannerState.resumenMensual },
  //     montoOriginal: Number(formState.montoOriginal || 0),
  //     razonSocial: String(formState.cliente || ''),
  //     codigoCliente: formState.codigo_cliente || '',
  //     ruc: formState.documento_cliente || '',
  //     linea: String(formState.linea_planificador_color || ''),
  //     pedido: String(formState.pedido_planificador || ''),
  //   };
    
  //   const payload = dataToExport || cleanPayload;

  //   try {
  //     // Export XLSX
  //     const xlsxBlob = await generarReporte(payload);
  //     const xlsxUrl = window.URL.createObjectURL(xlsxBlob);
  //     const xlsxA = document.createElement('a');
  //     xlsxA.href = xlsxUrl;
  //     xlsxA.download = `planificador_${formState.cliente || 'reporte'}_${new Date().toISOString().slice(0,10)}.xlsx`; // Dynamic filename
  //     document.body.appendChild(xlsxA);
  //     xlsxA.click();
  //     xlsxA.remove();

  //     // Export JSON backup
  //     const jsonBlob = await generarReporteJson(payload);
  //     const jsonUrl = window.URL.createObjectURL(jsonBlob);
  //     const jsonA = document.createElement('a');
  //     jsonA.href = jsonUrl;
  //     jsonA.download = `planificador_${formState.cliente || 'reporte'}_${new Date().toISOString().slice(0,10)}.json`; // Dynamic filename
  //     document.body.appendChild(jsonA);
  //     jsonA.click();
  //     jsonA.remove();

  //     handleClearModule();

  //   } catch (error) {
  //     console.error("Error al exportar:", error);
  //     alert("No se pudo generar el archivo de reporte. Verifique que el servidor backend esté funcionando.");
  //   }
  // }, [formState, montosAjustados, plannerState.fechasOrdenadas, plannerState.resumenMensual, handleClearModule]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // const data = await readFileContent(file); // Use the new utility // Commented out

      if (fileSelectionMode === 'loadAndEdit') {
        // Basic validation of the loaded data
        // if (data && typeof data === 'object' && data !== null) { // Ensure data is an object // Commented out
          // const loadedSelectedDates = Array.isArray(data.selectedDates) ? new Set(data.selectedDates) : new Set(); // Commented out
          // const loadedFechasOrdenadas = Array.isArray(data.fechasOrdenadas) ? data.fechasOrdenadas : []; // Commented out
          // const loadedMontosAsignados = typeof data.montosAsignados === 'object' && data.montosAsignados !== null ? data.montosAsignados as Record<string, number> : {}; // Commented out
          // const loadedResumenMensual = typeof data.resumenMensual === 'object' && data.resumenMensual !== null ? data.resumenMensual as Record<string, number> : {}; // Commented out

          const localPlannerUpdate: Partial<PlannerState> = {
              // selectedDates: loadedSelectedDates, // Commented out
              // fechasOrdenadas: loadedFechasOrdenadas, // Commented out
              // montosAsignados: loadedMontosAsignados, // Commented out
              // resumenMensual: loadedResumenMensual, // Commented out
              isDataDirty: false,
          };
          setPlannerState(prevState => ({ ...prevState, ...localPlannerUpdate }));
          // setMontosAjustados(loadedMontosAsignados); // Commented out

          // Also update the global form state
          // const formFieldsToUpdate: Array<keyof IForm> = ['montoOriginal', 'cliente', 'documento_cliente', 'codigo_cliente', 'sucursal', 'pedido_planificador', 'linea_planificador_color']; // Commented out
          // formFieldsToUpdate.forEach(field => { // Commented out
              // const value = data[field]; // Commented out
              // Ensure value is string or number before updating form
              // if (value !== undefined && value !== null && (typeof value === 'string' || typeof value === 'number')) { // Commented out
                  // actualizarFormulario('planificador', field, value); // Commented out
              // }
          // }); // Commented out

          // mostrarToast('Respaldo cargado correctamente.', 'success'); // Commented out
        // } else { // Commented out
          // mostrarToast('El archivo de respaldo no tiene el formato esperado.', 'error'); // Commented out
        // }
      } else if (fileSelectionMode === 'createCopy') {
        // await handleExportAjustado(data); // Export directly with loaded data // Commented out
      }
    } catch (error) {
      console.error('Error al cargar el respaldo:', error);
      // mostrarToast('Error al procesar el archivo de respaldo.', 'error'); // Commented out
    } finally {
      // Reset file input to allow loading the same file again
      if (event.target) {
        event.target.value = '';
      }
      setFileSelectionMode(null); // Reset mode after processing
    }
  }, [actualizarFormulario, fileSelectionMode]); // handleExportAjustado removed from dependencies

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
          // if (parsedState.plannerState && Array.isArray(parsedState.plannerState.selectedDates)) { // Commented out
          //   parsedState.plannerState.selectedDates = new Set(parsedState.plannerState.selectedDates); // Commented out
          // }
          setPlannerState(prevState => ({...prevState, ...parsedState.plannerState}));

          // const formFieldsToUpdate: Array<keyof IForm> = ['montoOriginal', 'cliente', 'documento_cliente', 'codigo_cliente', 'sucursal', 'pedido_planificador', 'linea_planificador_color']; // Commented out
          // formFieldsToUpdate.forEach(field => { // Commented out
              // const value = parsedState.formState?.planificador?.[field]; // Commented out
              // if (value !== undefined) { // Commented out
                  // actualizarFormulario('planificador', field, value); // Commented out
              // } // Commented out
          // }); // Commented out
        }
      } catch (error) {
        console.error('Error initializing PlanificadorPage:', error);
        // mostrarToast('Error al iniciar la aplicación', 'error');
      }
    };

    initializeApp();
  }, [actualizarFormulario]);

  // const handleClearSelectedDates = useCallback(() => { // Commented out
  //   setPlannerState(prevState => ({
  //     ...prevState,
  //     selectedDates: new Set([]),
  //     isDataDirty: true, // Mark data as dirty if dates are cleared
  //   }));
  // }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 surface">
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
          <CollapsiblePanel title="1. Datos Generales" defaultCollapsed={true}>
            <DatosGeneralesForm
              tipo="planificador"
              fieldConfig={{
                showRucDni: true,
                showCodigoCliente: true,
                showSucursal: true,
                showFecha: true,
                showColaborador: true,
                showMontoOriginal: true,
                showPedidoPlanificador: true,
                showLineaPlanificadorColor: true,
                showCargarRespaldo: true,
              }}
              formState={formState}
              onFormChange={handleFormChange}
              onOpenBackupModal={handleOpenBackupModal}
            />
          </CollapsiblePanel>

          {/* <CollapsiblePanel title="2. Selección de Fechas" defaultCollapsed={true}>
            <SeleccionFechas
              selectedDates={plannerState.selectedDates}
              fetchCalendarEvents={fetchCalendarEvents}
              handleDateClick={handleDateClick}
              handleDayCellMount={handleDayCellMount}
              onCalcular={calcular}
              isCalcularDisabled={isCalcularDisabled}
              onClearSelectedDates={handleClearSelectedDates}
            />
          </CollapsiblePanel> */}

          {/* <CollapsiblePanel title="3. Resultados" defaultCollapsed={true}>
            <ResultadosPlanner
              resumenMensual={plannerState.resumenMensual}
              montoOriginal={Number(formState.montoOriginal) || 0}
              montosAsignados={montosAjustados}
              montosAjustadosStr={montosAjustadosStr}
              linea={formState.linea_planificador_color || ''}
              onMontoAjustadoChange={handleMontoAjustadoChange}
              onExportAjustado={handleExportAjustado}
            />
          </CollapsiblePanel> */}
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
