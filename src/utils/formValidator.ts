import { MAX_FECHAS, MAX_AMOUNT, LABELS } from './config';

interface ValidationData {
    monto: number;
    fechas: string[];
    ruc: string;
    razonSocial: string;
    pedido: string;
}

export interface FieldError {
    field: string;
    message: string;
}

interface ValidationResult {
    fieldErrors: FieldError[];
    generalErrors: string[];
    isValid: boolean;
}

export class FormValidator {
    static validate(data: ValidationData): ValidationResult {
        const fieldErrors: FieldError[] = []; // Errores asociados a campos específicos
        const generalErrors: string[] = []; // Errores generales (e.g., para toasts)

        if (isNaN(data.monto) || data.monto <= 0 || data.monto > MAX_AMOUNT) {
            fieldErrors.push({ field: 'monto', message: LABELS.error_invalid_amount });
        }
        if (data.fechas.length === 0) {
            generalErrors.push(LABELS.error_no_dates);
        }
        if (data.fechas.length > MAX_FECHAS) {
            generalErrors.push(`No puede seleccionar más de ${MAX_FECHAS} fechas.`);
        }
        if (typeof data.ruc !== 'string' || !/^\d{11}$/.test(data.ruc)) {
            fieldErrors.push({ field: 'ruc', message: LABELS.error_ruc });
        }
        if (!data.razonSocial) {
            fieldErrors.push({ field: 'desc-cliente', message: LABELS.error_razon_social_empty });
        }
        if (!data.pedido || data.pedido.trim() === '') {
            fieldErrors.push({ field: 'pedido', message: 'El código de pedido es requerido.' });
        }

        return { fieldErrors, generalErrors, isValid: fieldErrors.length === 0 && generalErrors.length === 0 };
    }
}