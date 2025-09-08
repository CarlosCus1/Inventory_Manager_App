import { ModuleType } from './enums';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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

  };
  return moduleNames[module];
};

export const formatWhatsAppMessage = (message: string): string => {
  return encodeURIComponent(message);
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove non-digits
};

export const formatCurrency = (value: number | string): string => {
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numberValue)) {
    return 'S/. 0.00';
  }
  return `S/. ${numberValue.toFixed(2)}`;
};

export const formatDecimal = (value: number | string): string => {
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numberValue)) {
    return '0.00';
  }
  return numberValue.toFixed(2);
};

/**
 * Format quantity for display according to rules:
 * - Whole numbers are shown without decimals (e.g. 200000)
 * - Numbers with fractional part show two decimals (e.g. 10.50)
 */
export const formatQuantityDisplay = (value: number | string): string => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    // integer
    return String(Math.round(n));
  }
  return n.toFixed(2);
};
