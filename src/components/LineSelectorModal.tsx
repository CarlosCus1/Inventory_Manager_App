import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from "../store/useAppStore";
import type { IProducto } from "../interfaces";
import { ModuleType } from '../enums';
import { Modal, Select, SearchInput, DataTable, Button } from './ui';

import type { State } from "../store/useAppStore";

type LineSelectorModalTriggerProps = {
  moduloKey: keyof State['listas'];
  showStockRef?: boolean;
  buttonClassName?: string;
  themeClass?: string;
  onConfirm?: (added: IProducto[], skipped: IProducto[]) => void;
};

/**
 * Componente Trigger + Modal para selección por línea mejorado.
 */
export function LineSelectorModalTrigger({
  moduloKey,
  showStockRef = false,
  buttonClassName,
  themeClass,
  onConfirm,
}: LineSelectorModalTriggerProps) {
  const [open, setOpen] = useState(false);

  // Map moduloKey to ModuleType
  const getModuleType = (key: keyof State['listas']): ModuleType => {
    switch (key) {
      case 'devoluciones': return ModuleType.DEVOLUCIONES;
      case 'pedido': return ModuleType.PEDIDO;
      case 'inventario': return ModuleType.INVENTARIO;
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

type ProductoLocal = IProducto & {
  linea?: string;
  stock_referencial?: number;
};

function useProductosLocal() {
  const [data, setData] = useState<ProductoLocal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/productos_local.json");
        if (!res.ok) throw new Error("No se pudo cargar productos_local.json");
        const json = (await res.json()) as ProductoLocal[];
        if (!cancel) setData(json);
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: unknown }).message ?? "Error cargando datos")
            : "Error cargando datos";
        if (!cancel) setError(message);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancel = true;
    };
  }, []);

  return { data, error, loading };
}

function getUniqueSortedLineas(productos: ProductoLocal[]): string[] {
  const set = new Set<string>();
  for (const p of productos) {
    const linea = (p.linea ?? "").toString().trim();
    if (linea) set.add(linea);
  }
  const collator = new Intl.Collator("es-PE");
  return Array.from(set).sort((a, b) => collator.compare(a, b));
}

function sortByCodigoAsc(productos: ProductoLocal[]): ProductoLocal[] {
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
  const lista = useAppStore((s) => {
    switch (moduloKey as keyof State['listas']) {
      case "inventario": return s.listas.inventario;
      case "precios": return s.listas.precios;
      case "devoluciones": return s.listas.devoluciones;
      case "pedido": return s.listas.pedido;
      case "comparador": return s.listas.comparador;
      default: return [];
    }
  });

  const agregarProductoToLista = useAppStore((s) => s.agregarProductoToLista);

  // Carga de productos
  const { data, error, loading } = useProductosLocal();

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

  const lineas = useMemo(() => (data ? getUniqueSortedLineas(data) : []), [data]);

  const productosDeLinea = useMemo(() => {
    if (!data || !selectedLinea) return [];
    const base = data.filter((p) => (p.linea ?? "").toString().trim() === selectedLinea);
    const ordenados = sortByCodigoAsc(base);
    if (!searchNombre.trim()) return ordenados;
    const term = normalize(searchNombre.trim());
    return ordenados.filter((p: ProductoLocal) => normalize(p.nombre ?? "").includes(term));
  }, [data, selectedLinea, searchNombre]);

  // Configuración de columnas para la tabla
  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: 'codigo',
        header: 'Código',
        width: '120px',
        render: (item: ProductoLocal) => (
          <span className="font-mono text-sm">{item.codigo}</span>
        )
      },
      {
        key: 'nombre',
        header: 'Nombre',
        render: (item: ProductoLocal) => (
          <span className="truncate max-w-xs" title={item.nombre}>
            {item.nombre}
          </span>
        )
      }
    ];

    if (showStockRef) {
      baseColumns.push({
        key: 'stock_referencial',
        header: 'Stock Ref.',
        width: '100px',
        align: 'right' as const,
        render: (item: ProductoLocal) => (
          <span className="font-mono text-sm">
            {typeof item.stock_referencial === "number" ? item.stock_referencial.toLocaleString() : "-"}
          </span>
        )
      });
    }

    return baseColumns;
  }, [showStockRef]);

  const handleConfirm = () => {
    if (!data) return;
    
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
        duplicados.push(p as unknown as IProducto);
      } else {
        nuevos.push(p as unknown as IProducto);
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
      <Button variant="outline" onClick={onClose}>
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
            <SearchInput
              placeholder="Buscar productos por nombre..."
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              onClear={() => setSearchNombre('')}
              module={module}
            />

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">Error: {error}</p>
              </div>
            )}

            <DataTable
              data={productosDeLinea}
              columns={columns}
              module={module}
              selectable
              selectedItems={selectedCodigos}
              onSelectionChange={setSelectedCodigos}
              getItemId={(item) => String(item.codigo)}
              loading={loading}
              emptyMessage={
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