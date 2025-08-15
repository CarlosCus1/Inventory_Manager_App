import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

interface RucData {
  razonSocial: string;
  estado: string;
  condicion: string;
}

interface UseRucManagerReturn {
  ruc: string;
  setRuc: React.Dispatch<React.SetStateAction<string>>;
  razonSocial: string;
  setRazonSocial: React.Dispatch<React.SetStateAction<string>>;
  error: string | null;
  isLoading: boolean;
  rucResult: RucData | null;
  handleRucSearch: () => Promise<void>;
  resetRuc: () => void;
}

export const useRucManager = (initialRuc = '', initialRazonSocial = ''): UseRucManagerReturn => {
  const fetchRuc = useAppStore((state) => state.fetchRuc);
  const [ruc, setRuc] = useState(initialRuc);
  const [razonSocial, setRazonSocial] = useState(initialRazonSocial);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rucResult, setRucResult] = useState<RucData | null>(null);
  const [lastSearchedRuc, setLastSearchedRuc] = useState<string | null>(null);

  const handleRucSearch = useCallback(async () => {
    const trimmedRuc = ruc.trim();
    if (trimmedRuc.length !== 11) {
      setError('El RUC debe tener 11 dígitos.');
      return;
    }

    if (trimmedRuc === lastSearchedRuc) {
      return; // Avoid re-searching the same RUC
    }

    setIsLoading(true);
    setError(null);
    setRucResult(null);

    try {
      const result = await fetchRuc(trimmedRuc);
      setRucResult(result);
      if (result.razonSocial) {
        setRazonSocial(result.razonSocial);
      }
      setLastSearchedRuc(trimmedRuc);
    } catch (err) {
      setError((err as Error).message || 'No se pudo consultar el RUC. Puede ingresar la razón social manualmente.');
      setRazonSocial(''); // Clear razon social on error
    } finally {
      setIsLoading(false);
    }
  }, [ruc, lastSearchedRuc, fetchRuc]);

  const resetRuc = useCallback(() => {
    setRuc('');
    setRazonSocial('');
    setError(null);
    setIsLoading(false);
    setRucResult(null);
    setLastSearchedRuc(null);
  }, []);

  return {
    ruc,
    setRuc,
    razonSocial,
    setRazonSocial,
    error,
    isLoading,
    rucResult,
    handleRucSearch,
    resetRuc,
  };
};
