
// --------------------------------------------------------------------------- #
//                                                                             #
//              src/components/DataTable.tsx (Refactorizado)                   #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React from 'react';

// --- 2. Definición de las Props del Componente ---
// Interfaz para definir la estructura de una columna.
// Usamos un tipo genérico <T> para que funcione con cualquier tipo de dato.
export interface IColumn<T> {
  header: string; // El texto que se mostrará en el encabezado <th>.
  accessor: keyof T | (string & {}); // La clave para acceder al dato en el objeto de la fila.
  cellRenderer?: (row: T) => React.ReactNode; // Función opcional para renderizado personalizado.
  align?: 'left' | 'center' | 'right'; // Added this line
}

interface Props<T> {
  data: T[];
  columns: IColumn<T>[];
  noDataMessage?: string; // Mensaje opcional para cuando no hay datos.
  compact?: boolean; // use compact table spacing
  colClasses?: string[]; // optional classes for <col> elements to set widths
}

// --- 3. Definición del Componente ---
// Usamos un tipo genérico <T> y le damos una restricción para que los datos siempre
// tengan una propiedad `codigo` que podamos usar como `key` para la fila.
export const DataTable = <T extends { codigo: string }>({ 
  data, 
  columns, 
  noDataMessage = 'No hay productos en la lista.',
  compact = false,
  colClasses = []
}: Props<T>) => {
  // --- Renderizado del Componente ---
  return (
    <div className="w-full overflow-hidden surface-border rounded-lg shadow-md">
      {/* El contenedor `overflow-x-auto` es clave para la responsividad en móviles. */}
      {/* Permite que la tabla se desplace horizontalmente si no cabe en la pantalla. */}
      <div className="overflow-x-auto">
        <table className={`min-w-full surface ${compact ? 'table-compact' : ''}`}>
          {colClasses.length > 0 && (
            <colgroup>
              {colClasses.map((c, idx) => (
                <col key={idx} className={c} />
              ))}
            </colgroup>
          )}
          {/* Encabezado de la Tabla */}
          <thead className="surface-contrast">
            <tr>
              {columns.map((column) => (
                <th
                  key={`${column.header}-${String(column.accessor)}`}
                  className={`px-4 py-2 text-${column.align || 'left'} text-xs font-bold uppercase tracking-wider`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.codigo} className="transition-colors duration-150 hover:opacity-90">
                  {columns.map((column) => (
                    <td key={String(column.accessor)} className={`px-4 py-2 break-words text-sm text-${column.align || 'left'}`}>
                      {/* Si hay un `cellRenderer`, lo usamos. Si no, mostramos el dato directamente. */}
                      {column.cellRenderer 
                        ? column.cellRenderer(row) 
                        : String(row[column.accessor as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Mensaje cuando no hay datos en la tabla.
              <tr>
                <td colSpan={columns.length} className="text-center py-10 muted">
                  {noDataMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
