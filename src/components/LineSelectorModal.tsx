import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from "../store/useAppStore";
import type { IProducto } from "../interfaces";
import { ModuleType } from '../enums';
import { Modal, Select, SearchInput, Button } from './ui';
import { DataTable, type IColumn } from './DataTable';

import type { State } from "../store/useAppStore";

type LineSelectorModalTriggerProps = {
  moduloKey: keyof State['listas'];
  showStockRef?: boolean;
  buttonClassName?: string;
  onConfirm?: (added: IProducto[], skipped: IProducto[]) => void;
};

/**
 * Componente Trigger + Modal para selección por línea mejorado.
 */
export function LineSelectorModalTrigger({
  moduloKey,
  showStockRef = false,
  buttonClassName,
  onConfirm,
}: LineSelectorModalTriggerProps) {
  const [open, setOpen] = useState(false);

  // Map moduloKey to ModuleType
  const getModuleType = (key: keyof State['listas']): ModuleType => {
    switch (key) {
      case 'devoluciones': return ModuleType.DEVOLUCIONES;
      case 'pedido': return ModuleType.PEDIDO;
      case 'inventario': return ModuleType.INVENTARIO;
      case 'precios': return ModuleType.COMPARADOR;
      case 'comparador': return ModuleType.COMPARADOR;
      default: return ModuleType.PEDIDO;
    }
  };

  const module = getModuleType(moduloKey);

  return (
    <>
      <Button
        module={module}
        variant="outline"
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Elegir línea
      </Button>

      <LineSelectorModal
        isOpen={open}
        moduloKey={moduloKey}
        module={module}
        showStockRef={showStockRef}
        onClose={() => setOpen(false)}
        onConfirm={(added, skipped) => {
          onConfirm?.(added, skipped);
          setOpen(false);
        }}
      />
    </>
  );
}

type LineSelectorModalProps = {
  isOpen: boolean;
  moduloKey: keyof State['listas'];
  module: ModuleType;
  showStockRef: boolean;
  onClose: () => void;
  onConfirm: (added: IProducto[], skipped: IProducto[]) => void;
};

function getUniqueSortedLineas(productos: IProducto[]): string[] {
  const set = new Set<string>();
  for (const p of productos) {
    const linea = (p.linea ?? "").toString().trim();
    if (linea) set.add(linea);
  }
  const collator = new Intl.Collator("es-PE");
  return Array.from(set).sort((a, b) => collator.compare(a, b));
}

function sortByCodigoAsc(productos: IProducto[]): IProducto[] {
  const collator = new Intl.Collator("es-PE", { numeric: true, sensitivity: "base" });
  return [...productos].sort((a, b) =>
    collator.compare(String(a.codigo ?? ""), String(b.codigo ?? ""))
  );
}

function normalize(s: string) {
  return s.toLocaleLowerCase("es-PE");
}

/**
 * Modal de selección por línea mejorado con componentes modulares.
 */
function LineSelectorModal({
  isOpen,
  moduloKey,
  module,
  showStockRef,
  onClose,
  onConfirm
}: LineSelectorModalProps) {
  // Store
  const catalogo = useAppStore((s) => s.catalogo);
  
  const error = useAppStore((s) => s.error);
  const agregarProductoToLista = useAppStore((s) => s.agregarProductoToLista);
  const listas = useAppStore((s) => s.listas);
  const lista = listas[moduloKey];

  // Estados del modal
  const [selectedLinea, setSelectedLinea] = useState<string>('');
  const [searchNombre, setSearchNombre] = useState('');
  const [selectedCodigos, setSelectedCodigos] = useState<Set<string | number>>(new Set());

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLinea('');
      setSearchNombre('');
      setSelectedCodigos(new Set());
    }
  }, [isOpen]);

  const lineas = useMemo(() => (catalogo ? getUniqueSortedLineas(catalogo) : []), [catalogo]);

  const productosDeLinea = useMemo(() => {
    if (!catalogo || !selectedLinea) return [];
    const base = catalogo.filter((p) => (p.linea ?? "").toString().trim() === selectedLinea);
    const ordenados = sortByCodigoAsc(base);
    if (!searchNombre.trim()) return ordenados;
    const term = normalize(searchNombre.trim());
    return ordenados.filter((p: IProducto) => normalize(p.nombre ?? "").includes(term));
  }, [catalogo, selectedLinea, searchNombre]);

  const toggleSelection = (codigo: string | number) => {
    setSelectedCodigos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codigo)) {
        newSet.delete(codigo);
      } else {
        newSet.add(codigo);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCodigos.size === productosDeLinea.length) {
      setSelectedCodigos(new Set());
    } else {
      setSelectedCodigos(new Set(productosDeLinea.map(p => p.codigo)));
    }
  };

  // Configuración de columnas para la tabla
  const columns: IColumn<IProducto>[] = useMemo(() => {
    const baseColumns: IColumn<IProducto>[] = [
      {
        header: (
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
            checked={selectedCodigos.size === productosDeLinea.length && productosDeLinea.length > 0}
            onChange={toggleSelectAll}
          />
        ),
        accessor: 'codigo',
        align: 'center',
        cellRenderer: (item: IProducto) => (
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
            checked={selectedCodigos.has(item.codigo)}
            onChange={() => toggleSelection(item.codigo)}
          />
        )
      },
      {
        header: 'Código',
        accessor: 'codigo',
        cellRenderer: (item: IProducto) => (
          <span className="font-mono text-sm">{item.codigo}</span>
        )
      },
      {
        header: 'Nombre',
        accessor: 'nombre',
        cellRenderer: (item: IProducto) => (
          <span className="truncate max-w-xs" title={item.nombre}>
            {item.nombre}
          </span>
        )
      }
    ];

    if (showStockRef) {
      baseColumns.push({
        header: 'Stock Ref.',
        accessor: 'stock_referencial',
        align: 'right',
        cellRenderer: (item: IProducto) => (
          <div className="text-right">
            <span className="font-mono text-sm">
              {typeof item.stock_referencial === "number" ? item.stock_referencial.toLocaleString() : "-"}
            </span>
          </div>
        )
      });
    }

    return baseColumns;
  }, [showStockRef, selectedCodigos, productosDeLinea]);

  const handleConfirm = () => {
    if (!catalogo) return;

    // Productos seleccionados por código
    const seleccionados = productosDeLinea.filter((p) =>
      selectedCodigos.has(String(p.codigo))
    );

    // Evitar duplicados comparando por código contra la lista actual del módulo
    const yaEnLista = new Set<string>((lista || []).map((p: IProducto): string => String(p.codigo)));
    const nuevos: IProducto[] = [];
    const duplicados: IProducto[] = [];

    for (const p of seleccionados) {
      const codigo = String(p.codigo);
      if (yaEnLista.has(codigo)) {
        duplicados.push(p);
      } else {
        nuevos.push(p);
      }
    }

    // Agregar solo los nuevos al store
    for (const item of nuevos) {
      agregarProductoToLista(moduloKey, item);
    }

    // Notificar resultado
    onConfirm(nuevos, duplicados);
  };

  const actions = (
    <>
      <Button variant="outline" module={module} onClick={onClose} className="cancel-button-orange">
        Cancelar
      </Button>
      <Button
        module={module}
        variant="primary"
        onClick={handleConfirm}
        disabled={!selectedLinea || selectedCodigos.size === 0}
      >
        Agregar seleccionados ({selectedCodigos.size})
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar productos por línea"
      size="lg"
      module={module}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Paso 1: Selección de línea */}
        <div>
          <Select
            label="Línea de productos"
            value={selectedLinea}
            onChange={(e) => {
              setSelectedLinea(e.target.value);
              setSelectedCodigos(new Set()); // Reset selección
            }}
            module={module}
            required
          >
            <option value="">Seleccione una línea</option>
            {lineas.map((linea) => (
              <option key={linea} value={linea}>
                {linea}
              </option>
            ))}
          </Select>
        </div>

        {/* Paso 2: Búsqueda y selección de productos */}
        {selectedLinea && (
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="search-productos" className="form-label">Buscar productos</label>
              <SearchInput
                id="search-productos"
                placeholder="Buscar productos por nombre..."
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                onClear={() => setSearchNombre('')}
                module={module}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">Error: {error}</p>
              </div>
            )}

            <DataTable
              data={productosDeLinea}
              columns={columns}
              noDataMessage={
                selectedLinea
                  ? "No hay productos para la línea seleccionada con el filtro actual."
                  : "Seleccione una línea para ver los productos disponibles."
              }
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default LineSelectorModal;
