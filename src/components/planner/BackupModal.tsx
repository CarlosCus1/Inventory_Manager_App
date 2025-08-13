import React, { useCallback, useRef } from 'react';
import { FileManager } from '../../utils/fileManager';
import { mostrarToast, mostrarLoading, downloadFile, normalizeStringForFilename } from '../../utils/uiUtils';
import * as DateUtils from '../../utils/dateUtils';
import { generarReporte, generarReporteJson } from '../../utils/api';

interface BackupModalProps {
  show: boolean;
  onClose: () => void;
  setPlannerState: React.Dispatch<React.SetStateAction<any>>; // Adjust type as needed
  plannerState: any; // Adjust type as needed
}

export const BackupModal: React.FC<BackupModalProps> = ({
  show,
  onClose,
  setPlannerState,
  plannerState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const _generateExactCopy = useCallback(async (data: any) => {
    try {
      mostrarLoading(true, 'Generando copia exacta...');
      const reportData = {
        montoOriginal: data.montoOriginal,
        fechasOrdenadas: data.fechasOrdenadas,
        montosAsignados: data.montosAsignados,
        resumenMensual: data.resumenMensual,
        razonSocial: data.razonSocial,
        ruc: data.ruc,
        linea: data.linea,
        pedido: data.pedido,
        codigoCliente: data.codigoCliente
      };

      const formattedMonthYear = DateUtils.formatearMesAnioParaFilename(new Date());
      const sanitizedPedido = normalizeStringForFilename(data.pedido || '');
      const sanitizedCliente = normalizeStringForFilename(data.razonSocial || '');
      const baseFilename = `${sanitizedPedido}-${sanitizedCliente}-${formattedMonthYear}`;

      const excelBlob = await generarReporte(reportData);
      const excelFilename = `reporte_${baseFilename}.xlsx`;
      downloadFile(excelBlob, excelFilename);
      mostrarToast('Reporte Excel generado correctamente', 'success');

      const jsonBlob = await generarReporteJson(reportData);
      const jsonFilename = `respaldo_${baseFilename}.json`;
      downloadFile(jsonBlob, jsonFilename);
      mostrarToast('Respaldo JSON generado correctamente', 'success');

    } catch (error: any) {
      console.error('Error al generar copia exacta:', error);
      mostrarToast(error.message || 'Error al generar copia exacta.', 'error');
    } finally {
      mostrarLoading(false);
    }
  }, [mostrarLoading, mostrarToast]);

  const cargarDatosDesdeRespaldo = useCallback((data: any) => {
    // Capture current UI values for sensitive fields
    // These refs are not directly available in this component, will need to be passed or handled differently
    // For now, we'll assume they are handled by the parent component after state update

    // Prepare loaded values
    const loadedRuc = data.ruc || '';
    const loadedDescCliente = data.razonSocial || '';
    const loadedLinea = data.linea || 'otros';
    const loadedPedido = data.pedido || '';

    // Confirmations will need to be handled by the parent component or a more complex modal state
    // For simplicity, we'll directly update the state for now.

    setPlannerState(prevState => ({
      ...prevState,
      montoOriginal: data.montoOriginal || 0,
      selectedDates: new Set(data.fechasOrdenadas || []),
      fechasOrdenadas: data.fechasOrdenadas || [],
      montosAsignados: data.montosAsignados || {},
      resumenMensual: data.resumenMensual || {},
      ruc: data.ruc,
      descCliente: data.razonSocial,
      linea: data.linea,
      pedido: data.pedido,
      codigoCliente: data.codigoCliente || '',
      isDataDirty: true // Mark as dirty to force recalculation if necessary
    }));

    mostrarToast('Respaldo cargado para edición exitosamente.', 'success');
    onClose();
  }, [setPlannerState, mostrarToast, onClose]);

  const handleFileLoad = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'edit' | 'copy') => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        mostrarLoading(true, `Cargando respaldo para ${type === 'edit' ? 'edición' : 'copia exacta'}...`);
        const loadedData = await FileManager.loadJsonFile(file);
        if (type === 'edit') {
          cargarDatosDesdeRespaldo(loadedData);
        } else {
          await _generateExactCopy(loadedData);
        }
      } catch (error) {
        console.error(`Error al cargar el archivo de respaldo para ${type}:`, error);
        mostrarToast(`Error al cargar el archivo de respaldo para ${type}.`, 'error');
      } finally {
        mostrarLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input
        }
      }
    }
  }, [cargarDatosDesdeRespaldo, _generateExactCopy, mostrarLoading, mostrarToast]);

  if (!show) {
    return null;
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Cargar Respaldo</h3>
        <p>¿Cómo deseas cargar el respaldo?</p>
        <div className="modal-actions">
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={(e) => handleFileLoad(e, 'edit')}
          />
          <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            Cargar para Editar
          </button>
          <button type="button" className="btn-secondary" onClick={(e) => {
            if (fileInputRef.current) {
              fileInputRef.current.onchange = (event) => handleFileLoad(event as React.ChangeEvent<HTMLInputElement>, 'copy');
              fileInputRef.current.click();
            }
          }}>
            Generar Copia Exacta
          </button>
          <button type="button" className="btn-tertiary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};