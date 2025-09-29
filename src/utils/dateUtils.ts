// import { fetchHolidaysApi } from './api'; // Commented out - not needed for current functionality

export const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Obtiene la lista de feriados peruanos para un año dado.
 * Primero intenta obtenerlos del caché, si no, los pide a la API.
 * @param {number} year - El año para el cual obtener los feriados.
 * @returns {Promise<Array<{date: string, name: string}>>} - Una promesa que resuelve a un array de objetos feriado.
 */
const feriadosCache = new Map<number, Array<{date: string, name: string}>>();

export async function obtenerFeriados(year: number): Promise<Array<{date: string, name: string}>> {
    const cacheKey = `feriados-${year}`;
    
    if (feriadosCache.has(year)) {
        return feriadosCache.get(year)!;
    }

    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
        const feriados = JSON.parse(cachedData);
        feriadosCache.set(year, feriados);
        return feriados;
    }

    try {
        // Commented out - fetchHolidaysApi not available in current implementation
        // const feriadosArray = await fetchHolidaysApi(year);
        // feriadosCache.set(year, feriadosArray);
        // sessionStorage.setItem(cacheKey, JSON.stringify(feriadosArray));
        // return feriadosArray;

        // Return empty array for now - holidays functionality not needed
        const emptyHolidays: Array<{date: string, name: string}> = [];
        feriadosCache.set(year, emptyHolidays);
        sessionStorage.setItem(cacheKey, JSON.stringify(emptyHolidays));
        return emptyHolidays;
    } catch (error) {
        console.error(`Error al obtener los feriados para el año ${year}:`, error);
        throw error;
    }
}

/**
 * Formatea un objeto Date a "DD/MM/YYYY"
 * @param {Date} date - La fecha a formatear
 * @returns {string}
 */
export function formatearFecha(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Convierte un string "DD/MM/YYYY" a un objeto Date
 * @param {string} dateStr - La fecha en formato string
 * @returns {Date}
 */
export function parsearFecha(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Verifica si una fecha es anterior al día de hoy
 * @param {Date} date - La fecha a verificar
 * @returns {boolean}
 */
export function esPasado(date: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date < hoy;
}

/**
 * Verifica si una fecha es domingo
 * @param {Date} date - La fecha a verificar
 * @returns {boolean}
 */
export function esDomingo(date: Date): boolean {
    return date.getDay() === 0;
}

/**
 * Verifica si una fecha está en la lista de feriados
 * @param {string} dateStr - La fecha en formato "DD/MM/YYYY"
 * @param {Set<string>} feriados - Set de feriados
 * @returns {boolean} 
 */
export function esFeriado(dateStr: string, feriadosSet: Set<string>): boolean {
    return feriadosSet.has(dateStr);
}

/**
 * Calcula la diferencia de días entre una fecha y hoy.
 * @param {string} dateStr - La fecha en formato "DD/MM/YYYY"
 * @returns {number} Número de días de diferencia.
 */
export function diasDesdeHoy(dateStr: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = parsearFecha(dateStr);
    const diffTime = fecha.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export function obtenerMesAnio(dateStr: string): string {
    const date = parsearFecha(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Formats a "YYYY-MM" string to "Month YYYY" for display.
 * @param {string} mesAnioStr - The date string in "YYYY-MM" format.
 * @returns {string}
 */
export function formatearMesAnioDisplay(mesAnioStr: string): string {
    const [year, month] = mesAnioStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Formats a Date object to "YYYY-MM-DD" for use in filenames.
 * @param {Date} date - The date to format.
 * @returns {string}
 */
export function formatearParaFilename(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to "MM_YY" for use in filenames.
 * @param {Date} date - The date to format.
 * @returns {string}
 */
export function formatearMesAnioParaFilename(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
    return `${month}_${year}`;
}
