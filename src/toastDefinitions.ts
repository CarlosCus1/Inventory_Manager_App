export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

export type ToastTypeString = `${ToastType}`;

export interface ToastProps {
  id: string;
  type: ToastTypeString;
  message: string;
  onClose: (id: string) => void;
}