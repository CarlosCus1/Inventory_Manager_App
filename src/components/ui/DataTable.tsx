import React from 'react';
import { ModuleType } from '../../enums';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  module?: ModuleType;
  selectable?: boolean;
  selectedItems?: Set<string | number>;
  onSelectionChange?: (selectedItems: Set<string | number>) => void;
  getItemId?: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  module,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  getItemId,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  className = ''
}: DataTableProps<T>) {
  const moduleClass = module ? `module-${module}` : '';

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange || !getItemId) return;
    
    if (checked) {
      const allIds = new Set(data.map(getItemId));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!onSelectionChange || !getItemId) return;
    
    const itemId = getItemId(item);
    const newSelection = new Set(selectedItems);
    
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    
    onSelectionChange(newSelection);
  };

  const isAllSelected = selectable && data.length > 0 && 
    data.every(item => getItemId ? selectedItems.has(getItemId(item)) : false);
  
  const isIndeterminate = selectable && selectedItems.size > 0 && !isAllSelected;

  return (
    <div className={`data-table-container ${moduleClass} ${className}`}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={`${String(column.key)}-${index}`}
                  className={`px-4 py-3 ${column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="loading-spinner" />
                    <span>Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center opacity-70">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const itemId = getItemId ? getItemId(item) : index;
                const isSelected = selectable && selectedItems.has(itemId);
                
                return (
                  <tr 
                    key={itemId}
                    className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item, e.target.checked)}
                          className="rounded"
                          aria-label={`Seleccionar fila ${index + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${String(column.key)}-${colIndex}`}
                        className={`px-4 py-3 ${column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {column.render 
                          ? column.render(item, index)
                          : String((item as any)[column.key] ?? '')
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {selectable && selectedItems.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium">
            {selectedItems.size} elemento{selectedItems.size !== 1 ? 's' : ''} seleccionado{selectedItems.size !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default DataTable;