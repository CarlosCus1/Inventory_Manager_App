import { createContext, useContext } from 'react';
import { ToastType } from '../toastDefinitions';
import type { ToastTypeString } from '../toastDefinitions';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastTypeString) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};