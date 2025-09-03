import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { IForm, ValidationRule } from '../interfaces';
import { useFormValidation } from './useFormValidation';
import { useToast } from '../contexts/ToastContext';

type ModuloKey = keyof ReturnType<typeof useAppStore.getState>['formState'];

export function useRucDni(moduloKey: ModuloKey) {
  const formState = useAppStore((state) => state.formState[moduloKey]);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);
  const fetchRuc = useAppStore((state) => state.fetchRuc);
  const { validate } = useFormValidation();
  const { addToast } = useToast();

  const [rucEstado, setRucEstado] = useState<string | null>(null);
  const [rucCondicion, setRucCondicion] = useState<string | null>(null);
  const [isLoadingRuc, setIsLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);
  const [debouncedDocumentNumber, setDebouncedDocumentNumber] = useState(formState?.documento_cliente || '');

  const handleRucDniChange = useCallback((type: 'ruc' | 'dni', number: string, social: string) => {
    actualizarFormulario(moduloKey, 'documentType' as keyof IForm, type);
    actualizarFormulario(moduloKey, 'documento_cliente' as keyof IForm, number);
    actualizarFormulario(moduloKey, 'cliente' as keyof IForm, social);
    setDebouncedDocumentNumber(number);
  }, [actualizarFormulario, moduloKey]);

  const handleRazonSocialManualChange = useCallback((social: string) => {
    actualizarFormulario(moduloKey, 'cliente' as keyof IForm, social);
  }, [actualizarFormulario, moduloKey]);

  useEffect(() => {
    const documentType = formState?.documentType; // Safely access documentType
    const documentNumber = debouncedDocumentNumber;

    const rules = (documentType === 'ruc' 
      ? [{ type: 'isRuc', message: 'El RUC debe tener 11 dígitos.' }]
      : [{ type: 'isDni', message: 'El DNI debe tener 8 dígitos.' }]) as ValidationRule[];

    const { isValid, errorMessage } = validate(documentNumber, rules);

    if (documentNumber.length === 0) {
        return;
    }

    if (!isValid) {
      addToast(errorMessage!, 'error');
      setRucError(errorMessage);
      actualizarFormulario(moduloKey, 'cliente' as keyof IForm, '');
      setRucEstado(null);
      setRucCondicion(null);
      return;
    } else {
      setRucError(null);
    }
    
    if (documentType === 'ruc') {
      setIsLoadingRuc(true);
      setRucEstado(null);
      setRucCondicion(null);

      const fetchRucData = async () => {
        try {
          const data = await fetchRuc(documentNumber);
          actualizarFormulario(moduloKey, 'cliente' as keyof IForm, data.razonSocial);
          setRucEstado(data.estado || null);
          setRucCondicion(data.condicion || null);
          addToast('RUC consultado con éxito.', 'success');
        } catch (err) {
          const errorMessage = (err as Error).message || 'Error al consultar RUC.';
          addToast(errorMessage, 'error');
          setRucError(errorMessage);
          actualizarFormulario(moduloKey, 'cliente' as keyof IForm, '');
          setRucEstado(null);
          setRucCondicion(null);
        } finally {
          setIsLoadingRuc(false);
        }
      };
      fetchRucData();
    } else {
        setRucEstado(null);
        setRucCondicion(null);
    }
  }, [formState.documentType, debouncedDocumentNumber, actualizarFormulario, fetchRuc, moduloKey, validate, addToast]);

  return {
    rucEstado,
    rucCondicion,
    isLoadingRuc,
    rucError,
    handleRucDniChange,
    handleRazonSocialManualChange,
  };
}
