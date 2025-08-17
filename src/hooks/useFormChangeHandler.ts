import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { IForm } from '../interfaces';

type ModuloKey = keyof ReturnType<typeof useAppStore.getState>['formState'];

export function useFormChangeHandler(moduloKey: ModuloKey) {
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    actualizarFormulario(moduloKey, name as keyof IForm, value);
  }, [actualizarFormulario, moduloKey]);

  return handleFormChange;
}
