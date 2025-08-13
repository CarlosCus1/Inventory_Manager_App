import React, { useState, useCallback, useEffect, useRef } from 'react';
import { consultarRuc } from '../utils/api'; // Assuming api.ts is in src/utils
import { mostrarToast } from '../utils/uiUtils'; // Assuming uiUtils.ts is in src/utils

interface RucInputProps {
  initialRuc?: string;
  initialRazonSocial?: string;
  onRucChange: (ruc: string, razonSocial: string, isValid: boolean) => void;
  rucInputRef: React.RefObject<HTMLInputElement>;
  descClienteInputRef: React.RefObject<HTMLInputElement>;
  rucErrorRef: React.RefObject<HTMLSpanElement>;
  rucLoadingRef: React.RefObject<HTMLDivElement>;
  rucResultRef: React.RefObject<HTMLDivElement>;
  razonSocialManualMessageRef: React.RefObject<HTMLSpanElement>;
}

export const RucInput: React.FC<RucInputProps> = ({
  initialRuc = '',
  initialRazonSocial = '',
  onRucChange,
  rucInputRef,
  descClienteInputRef,
  rucErrorRef,
  rucLoadingRef,
  rucResultRef,
  razonSocialManualMessageRef,
}) => {
  const [ruc, setRuc] = useState(initialRuc);
  const [razonSocial, setRazonSocial] = useState(initialRazonSocial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rucData, setRucData] = useState<any>(null); // Store fetched RUC data
  const lastRUC = useRef(''); // To prevent re-searching same RUC

  const ocultarError = useCallback(() => {
    setError('');
    if (rucErrorRef.current) rucErrorRef.current.textContent = '';
  }, []);

  const mostrarError = useCallback((message: string) => {
    setError(message);
    if (rucErrorRef.current) rucErrorRef.current.textContent = message;
  }, []);

  const mostrarCargando = useCallback((message: string = 'Buscando RUC...') => {
    setLoading(true);
    if (rucLoadingRef.current) {
      rucLoadingRef.current.hidden = false;
      const span = rucLoadingRef.current.querySelector('span');
      if (span) span.textContent = message;
    }
    if (rucInputRef.current) rucInputRef.current.disabled = true;
  }, []);

  const ocultarCargando = useCallback(() => {
    setLoading(false);
    if (rucLoadingRef.current) rucLoadingRef.current.hidden = true;
    if (rucInputRef.current) rucInputRef.current.disabled = false;
  }, []);

  const habilitarRazonSocialManual = useCallback((message: string = 'Puede ingresar la razón social manualmente.') => {
    if (descClienteInputRef.current) {
      descClienteInputRef.current.readOnly = false;
      descClienteInputRef.current.value = ''; // Clear for manual entry
    }
    if (razonSocialManualMessageRef.current) {
      razonSocialManualMessageRef.current.textContent = message;
      razonSocialManualMessageRef.current.hidden = false;
    }
  }, []);

  const mostrarResultado = useCallback((data: any) => {
    setRucData(data);
    const estado = data.estado || 'OTRO';
    const condicion = data.condicion || 'OTRO';

    const estadoClass = estado.toLowerCase().includes('activo') ? 'activo' : 'inactivo';
    const condicionClass = condicion.toLowerCase().includes('habido') ? 'habido' : 'inactivo';

    if (rucResultRef.current) {
      rucResultRef.current.innerHTML = `
        <div class="ruc-result-item">
            <strong>Razón Social:</strong>
            <span>${data.razonSocial || 'No disponible'}</span>
        </div>
        <div class="ruc-result-item">
            <strong>Estado:</strong>
            <span class="ruc-result-status ${estadoClass}">${estado}</span>
        </div>
        <div class="ruc-result-item">
            <strong>Condición:</strong>
            <span class="ruc-result-status ${condicionClass}">${condicion}</span>
        </div>
      `;
      rucResultRef.current.hidden = false;
    }

    if (data.razonSocial) {
      setRazonSocial(data.razonSocial);
      if (descClienteInputRef.current) descClienteInputRef.current.value = data.razonSocial;
      if (razonSocialManualMessageRef.current) razonSocialManualMessageRef.current.hidden = true;
    } else {
      habilitarRazonSocialManual('Razón social no encontrada. Puede ingresarla manualmente.');
      if (descClienteInputRef.current) descClienteInputRef.current.focus();
    }
  }, []);

  const resetRucInput = useCallback(() => {
    setRuc('');
    setRazonSocial('');
    setError('');
    setRucData(null);
    lastRUC.current = '';
    if (rucInputRef.current) rucInputRef.current.value = '';
    if (descClienteInputRef.current) descClienteInputRef.current.value = '';
    if (rucResultRef.current) rucResultRef.current.hidden = true;
    if (razonSocialManualMessageRef.current) {
      razonSocialManualMessageRef.current.textContent = 'Puede ingresar la razón social manualmente.';
      razonSocialManualMessageRef.current.hidden = false;
    }
    ocultarError();
  }, []);

  const buscarRUC = useCallback(async (rucNumber: string) => {
    mostrarCargando();
    ocultarError();
    if (razonSocialManualMessageRef.current) razonSocialManualMessageRef.current.hidden = true;

    try {
      const resultado = await consultarRuc(rucNumber);
      mostrarResultado(resultado);
      onRucChange(rucNumber, resultado.razonSocial || '', true); // Notify parent
    } catch (error: any) {
      console.error('Error buscando RUC:', error);
      mostrarError(error.message || 'No se pudo consultar el RUC.');
      if (error.data && error.data.allowManual) {
        habilitarRazonSocialManual();
      } else {
        habilitarRazonSocialManual('Error al consultar RUC. Puede ingresar la razón social manualmente.');
      }
      onRucChange(rucNumber, '', false); // Notify parent of invalid RUC format
    } finally {
      ocultarCargando();
    }
  }, [mostrarCargando, ocultarCargando, mostrarError, mostrarResultado, habilitarRazonSocialManual, onRucChange]);

  const _triggerRucSearch = useCallback(() => {
    const currentRuc = rucInputRef.current?.value.trim() || '';

    if (currentRuc.length === 11) {
      if (currentRuc !== lastRUC.current) {
        buscarRUC(currentRuc);
        lastRUC.current = currentRuc;
      } else if (rucResultRef.current && rucResultRef.current.innerHTML !== '') {
        rucResultRef.current.hidden = false;
      }
    } else if (currentRuc.length > 0) {
      mostrarError('El RUC debe tener 11 dígitos');
      onRucChange(currentRuc, '', false); // Notify parent of invalid RUC format
    } else {
      resetRucInput(); // If field is empty, reset
      onRucChange('', '', true); // Notify parent that RUC is empty but valid
    }
  }, [buscarRUC, mostrarError, resetRucInput, onRucChange]);

  const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRuc = event.target.value.replace(/\D/g, '');
    setRuc(newRuc);
    event.target.value = newRuc; // Update the input field directly

    if (newRuc.length !== 11) {
      ocultarError();
      if (rucResultRef.current) {
        rucResultRef.current.hidden = true;
        rucResultRef.current.innerHTML = '';
      }
    }
  }, [ocultarError]);

  const handleBlur = useCallback(() => {
    _triggerRucSearch();
  }, [_triggerRucSearch]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      _triggerRucSearch();
    }
  }, [_triggerRucSearch]);

  // Effect to update internal state when initialRuc or initialRazonSocial props change
  useEffect(() => {
    setRuc(initialRuc);
    setRazonSocial(initialRazonSocial);
    if (rucInputRef.current) rucInputRef.current.value = initialRuc;
    if (descClienteInputRef.current) descClienteInputRef.current.value = initialRazonSocial;
    if (initialRuc) {
      lastRUC.current = initialRuc; // Set lastRUC if initialRuc is provided
    }
  }, [initialRuc, initialRazonSocial]);

  return (
    <>
      <div className="form-group">
        <label htmlFor="ruc">RUC</label>
        <input
          type="text"
          id="ruc"
          maxLength={11}
          pattern="\d{11}"
          required
          ref={rucInputRef}
          value={ruc} // Controlled component
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <span className="error-message" id="error-ruc" ref={rucErrorRef}>
          {error}
        </span>
        <div id="ruc-loading" className="loading-indicator" hidden={!loading} ref={rucLoadingRef}>
          <div className="spinner"></div>
          <span>Buscando RUC...</span>
        </div>
        <div id="ruc-result" className="ruc-result" hidden={!rucData} ref={rucResultRef}>
          {rucData && (
            <>
              <div className="ruc-result-item">
                <strong>Razón Social:</strong>
                <span>{rucData.razonSocial || 'No disponible'}</span>
              </div>
              <div className="ruc-result-item">
                <strong>Estado:</strong>
                <span className={`ruc-result-status ${rucData.estado?.toLowerCase().includes('activo') ? 'activo' : 'inactivo'}`}>
                  {rucData.estado}
                </span>
              </div>
              <div className="ruc-result-item">
                <strong>Condición:</strong>
                <span className={`ruc-result-status ${rucData.condicion?.toLowerCase().includes('habido') ? 'habido' : 'inactivo'}`}>
                  {rucData.condicion}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="desc-cliente">Razón Social</label>
        <input
          type="text"
          id="desc-cliente"
          ref={descClienteInputRef}
          value={razonSocial} // Controlled component
          onChange={(e) => setRazonSocial(e.target.value)}
        />
        <span className="error-message" id="error-desc-cliente"></span>
        <span className="info-message" id="manual-razon-social-message" hidden={!razonSocialManualMessageRef.current?.textContent} ref={razonSocialManualMessageRef}>
          {razonSocialManualMessageRef.current?.textContent}
        </span>
      </div>
    </>
  );
};