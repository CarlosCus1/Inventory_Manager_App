import { ModuleType } from './enums';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatModuleName = (module: ModuleType): string => {
  const moduleNames = {
    [ModuleType.DEVOLUCIONES]: 'Devoluciones',
    [ModuleType.PEDIDO]: 'Pedidos',
    [ModuleType.INVENTARIO]: 'Inventario', 
    [ModuleType.COMPARADOR]: 'Comparador',
    [ModuleType.PLANIFICADOR]: 'Planificador'
  };
  return moduleNames[module];
};

export const formatWhatsAppMessage = (message: string): string => {
  return encodeURIComponent(message);
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove non-digits
};