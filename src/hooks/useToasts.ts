import { useState, useCallback } from 'react';
import type { ToastProps, ToastTypeString } from '../toastDefinitions';

let toastId = 0;

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((message: string, type: ToastTypeString = 'info') => {
    const id = (toastId++).toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, onClose: () => {} }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};