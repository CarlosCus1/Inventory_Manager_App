class ApiError extends Error {
    statusCode: number;
    data: any;

    constructor(message: string, statusCode: number, data: any = null) {
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
    let lastError: any;
    
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
                try {
                    const errorData = await response.json();
                    throw new ApiError(errorData.message || `Error en el servidor: ${response.status}`, response.status, errorData);
                } catch (e: any) {
                    if (e instanceof ApiError) throw e;
                    throw new ApiError(`Error en la comunicación con el servidor: ${response.status}`, response.status);
                }
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
export async function fetchHolidays(year: number): Promise<Holiday[]> {
    try {
        const response = await fetchWithRetry(`/api/getHolidays?year=${year}`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener los feriados:', error);
        throw error; // Relanzar el error para que el llamador pueda manejarlo.
    }
}

interface RucData {
    razonSocial: string;
    estado: string;
    condicion: string;
    allowManual?: boolean;
}

/**
 * Consulta el RUC usando una API externa.
 * @param {string} ruc - El RUC a consultar.
 * @returns {Promise<RucData>} - La respuesta de la API.
 */
export async function consultarRuc(numero: string): Promise<RucData> {
    const response = await fetchWithRetry(`/api/consultar-ruc?numero=${encodeURIComponent(numero)}`);
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
    const response = await fetchWithRetry('/api/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Genera el reporte en formato Excel.
 * @param {any} data - Datos para el reporte.
 * @returns {Promise<Blob>} Un blob con el contenido del archivo .xlsx.
 */
export async function generarReporte(data: any): Promise<Blob> {
    const response = await fetchWithRetry('/api/generate-excel', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.blob();
}

/**
 * Genera el reporte en formato JSON.
 * @param {any} data - Datos para el reporte.
 * @returns {Promise<Blob>} Un blob con el contenido del archivo .json.
 */
export async function generarReporteJson(data: any): Promise<Blob> {
    const response = await fetchWithRetry('/api/generate-json', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.blob();
}