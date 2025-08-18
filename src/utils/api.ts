import type { RucData } from '../interfaces';

class ApiError extends Error {
    statusCode: number;
    data: unknown;

    constructor(message: string, statusCode: number, data: unknown = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

/**
 * Realiza una petición a la API con reintentos
 * @param {string} url - Endpoint de la API
 * @param {RequestInit} options - Opciones de la petición
 * @param {number} retries - Número de reintentos
 * @returns {Promise<Response>} Respuesta de la API
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 3): Promise<Response> {
    let lastError: unknown;
    
    const fetchOptions: RequestInit = { ...options };
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url,
                {
                    ...fetchOptions,
                    credentials: 'include', // Enviar cookies (necesario para CSRF)
                    headers: {
                        'Content-Type': 'application/json',
                        ...(fetchOptions.headers || {})
                    }
                }
            );
            
            if (!response.ok) {
                let errorMessage = `Error en el servidor: ${response.status}`;
                let errorData: unknown = null;
                try {
                    // Try to parse as JSON first
                    errorData = await response.json();
                    errorMessage = (errorData as { message?: string }).message || errorMessage;
                } catch (jsonError) {
                    // If JSON parsing fails, try to read as text
                    try {
                        errorMessage = await response.text();
                        if (errorMessage.length > 200) { // Truncate long HTML responses
                            errorMessage = errorMessage.substring(0, 200) + '... (truncated HTML)';
                        }
                    } catch (textError) {
                        // Fallback if even text reading fails
                        errorMessage = `Error desconocido del servidor: ${response.status}`;
                    }
                }
                throw new ApiError(errorMessage, response.status, errorData);
            }
            
            return response;
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    
    throw lastError;
}

interface Holiday {
    date: string;
    name: string;
}

/**
 * Obtiene los feriados para un año específico desde la función en la nube.
 * @param {number} year - El año para el cual se solicitan los feriados.
 * @returns {Promise<Holiday[]>} - Una promesa que resuelve a un array de objetos feriado.
 */
const API_BASE_URL = 'http://localhost:5000';

export async function fetchHolidays(year: number): Promise<Holiday[]> {
    // Hardcoded holidays for 2025 as per user request
    if (year === 2025) {
        return [
            { date: "2025-01-01", name: "Año Nuevo" },
            { date: "2025-04-17", name: "Jueves Santo" },
            { date: "2025-04-18", name: "Viernes Santo" },
            { date: "2025-05-01", name: "Día del Trabajo" },
            { date: "2025-06-07", name: "Batalla de Arica y Día de la Bandera" },
            { date: "2025-06-29", name: "San Pedro y San Pablo" },
            { date: "2025-07-23", name: "Día de la Fuerza Aérea del Perú" },
            { date: "2025-07-28", name: "Fiestas Patrias" },
            { date: "2025-07-29", name: "Fiestas Patrias" },
            { date: "2025-08-06", name: "Batalla de Junín" },
            { date: "2025-08-30", name: "Santa Rosa de Lima" },
            { date: "2025-10-08", name: "Combate de Angamos" },
            { date: "2025-11-01", name: "Día de Todos los Santos" },
            { date: "2025-12-08", name: "Inmaculada Concepción" },
            { date: "2025-12-09", name: "Batalla de Ayacucho" }
        ];
    }

    try {
        const timestamp = new Date().getTime();
        const response = await fetchWithRetry(`${API_BASE_URL}/api/getHolidays?year=${year}&t=${timestamp}`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener los feriados:', error);
        throw error; // Relanzar el error para que el llamador pueda manejarlo.
    }
}

/**
 * Consulta el RUC usando una API externa.
 * @param {string} ruc - El RUC a consultar.
 * @returns {Promise<RucData>} - La respuesta de la API.
 */
export async function consultarRuc(numero: string): Promise<RucData> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/consultar-ruc?numero=${encodeURIComponent(numero)}`);
    return response.json();
}

interface CalculationData {
    montoTotal: number;
    fechasValidas: string[];
    razonSocial: string;
}

interface CalculationResult {
    montosAsignados: Record<string, number>;
    resumenMensual: Record<string, number>;
}

/**
 * Realiza el cálculo de distribución
 * @param {CalculationData} data - Datos para el cálculo
 * @returns {Promise<CalculationResult>} Resultados del cálculo
 */
export async function calcular(data: CalculationData): Promise<CalculationResult> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Genera el reporte en formato Excel.
 * @param {Record<string, unknown>} data - Datos para el reporte.
 * @returns {Promise<Blob>} Un blob con el contenido del archivo .xlsx.
 */
export async function generarReporte(data: Record<string, unknown>): Promise<Blob> {
    // The backend is running on port 5000
    const response = await fetchWithRetry('http://localhost:5000/export-xlsx', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.blob();
}

/**
 * Genera un backup en formato JSON.
 * @param {Record<string, unknown>} data - Datos para el reporte.
 * @returns {Promise<Blob>} Un blob con el contenido del archivo .json.
 */
export async function generarReporteJson(data: Record<string, unknown>): Promise<Blob> {
    // No need to call a backend endpoint for this, we have all the data on the client.
    // Create a JSON string from the data.
    const jsonString = JSON.stringify(data, null, 2); // Pretty print the JSON
    // Create a blob from the JSON string.
    const blob = new Blob([jsonString], { type: 'application/json' });
    return Promise.resolve(blob);
}