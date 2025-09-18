
import type { PedidoExport, InventarioExport, DevolucionesExport, PreciosExport } from '../api/schemas';
import type { ICalcularApiParams, ICalcularApiResponse, RucData } from '../interfaces';

const EXPORT_API_BASE_URL = 'http://localhost:5001';
const RUC_API_BASE_URL = 'http://localhost:5001'; // Assuming RUC API is also on port 5000
const HOLIDAYS_API_BASE_URL = 'http://localhost:5001'; // Assuming Holidays API is also on port 5000

export const calcularApi = async (params: ICalcularApiParams): Promise<ICalcularApiResponse> => {
  const { montoTotal, fechasValidas } = params;

  try {
  const response = await fetch(`http://localhost:5001/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        montoTotal,
        fechasValidas,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en el cálculo de la API');
    }

    const data: ICalcularApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling calcularApi:', error);
    throw error;
  }
};

export const exportXlsxApi = async (payload: PedidoExport | InventarioExport | DevolucionesExport | PreciosExport): Promise<Blob> => {
  try {
    const response = await fetch(`${EXPORT_API_BASE_URL}/export-xlsx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Error desconocido al exportar el archivo XLSX';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'reporte.xlsx'; // Default filename
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8''|[^;]*?)([^\s;]+?)(?:['"]|$)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      } else {
        // Fallback for older or non-standard headers
        const fallbackMatch = contentDisposition.match(/filename=['"]?([^;]+?)['"]?$/i);
        if (fallbackMatch && fallbackMatch[1]) {
          filename = fallbackMatch[1];
        }
      }
    }

    const blob = await response.blob();
    // Attach filename to blob for easier handling in frontend
    Object.defineProperty(blob, 'name', { value: filename });
    return blob;
  } catch (error) {
    console.error('Error calling exportXlsxApi:', error);
    throw error;
  }
};

export const consultarRucApi = async (documentNumber: string): Promise<RucData> => {
  try {
    const response = await fetch(`${RUC_API_BASE_URL}/consultar-ruc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al consultar RUC/DNI');
    }

    const data: RucData = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling consultarRucApi:', error);
    throw error;
  }
};

export const fetchHolidaysApi = async (year: number): Promise<Array<{ date: string; name: string }>> => {
  try {
    const response = await fetch(`${HOLIDAYS_API_BASE_URL}/holidays/${year}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener feriados');
    }

    const data: Array<{ date: string; name: string }> = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling fetchHolidaysApi:', error);
    throw error;
  }
};
