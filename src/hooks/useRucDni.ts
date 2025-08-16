import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { IForm } from '../interfaces';

type ModuloKey = keyof ReturnType<typeof useAppStore.getState>['formState'];

export function useRucDni(moduloKey: ModuloKey) {
  const formState = useAppStore((state) => state.formState[moduloKey]);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);
  const fetchRuc = useAppStore((state) => state.fetchRuc);

  const [rucEstado, setRucEstado] = useState<string | null>(null);
  const [rucCondicion, setRucCondicion] = useState<string | null>(null);
  const [isLoadingRuc, setIsLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);
  const [debouncedDocumentNumber, setDebouncedDocumentNumber] = useState(formState.documento_cliente || '');

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
    if (formState.documentType === 'ruc' && debouncedDocumentNumber.length === 11) {
      setIsLoadingRuc(true);
      setRucError(null);
      setRucEstado(null);
      setRucCondicion(null);

      const fetchRucData = async () => {
        try {
          const data = await fetchRuc(debouncedDocumentNumber);
          actualizarFormulario(moduloKey, 'cliente' as keyof IForm, data.razonSocial);
          setRucEstado(data.estado || null);
          setRucCondicion(data.condicion || null);
        } catch (err) {
          setRucError((err as Error).message || 'Error al consultar RUC.');
          actualizarFormulario(moduloKey, 'cliente' as keyof IForm, '');
          setRucEstado(null);
          setRucCondicion(null);
        } finally {
          setIsLoadingRuc(false);
        }
      };
      fetchRucData();
    } else if (formState.documentType === 'ruc' && debouncedDocumentNumber.length !== 11) {
      setRucError('El RUC debe tener 11 dígitos.');
      actualizarFormulario(moduloKey, 'cliente' as keyof IForm, '');
      setRucEstado(null);
      setRucCondicion(null);
    } else {
      setRucError(null);
      setRucEstado(null);
      setRucCondicion(null);
    }
  }, [formState.documentType, debouncedDocumentNumber, actualizarFormulario, fetchRuc, moduloKey]);

  return {
    rucEstado,
    rucCondicion,
    isLoadingRuc,
    rucError,
    handleRucDniChange,
    handleRazonSocialManualChange,
  };
}
