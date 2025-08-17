import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from "../store/useAppStore";
import type { IProducto } from "../interfaces";
import { StyledSelect } from './ui/StyledSelect';

// Utilidad simple para clase condicional
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ModuloKey = "inventario" | "devoluciones" | "pedido" | "precios";

type LineSelectorModalTriggerProps = {
  moduloKey: ModuloKey;
  showStockRef?: boolean; // mostrar columna de stock en el modal (solo Pedido)
  buttonClassName?: string; // clases del botón (paleta por módulo)
  themeClass?: string; // clases para heredar color del módulo (título/CTA)
  onConfirm?: (added: IProducto[], skipped: IProducto[]) => void;
};

/**
 * Componente Trigger + Modal para selección por línea.
 * Se renderiza como un enlace "Elegir línea" y maneja internamente el modal.
 */
export function LineSelectorModalTrigger({
  moduloKey,
  showStockRef = false,
  buttonClassName,
  themeClass,
  onConfirm,
}: LineSelectorModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("ml-3 px-3 py-2 text-sm rounded", buttonClassName)}
        aria-label="Elegir línea"
        title="Elegir línea"
        type="button"
      >
        Elegir línea
      </button>

      {open && (
        <LineSelectorModal
          moduloKey={moduloKey}
          showStockRef={showStockRef}
          themeClass={themeClass}
          onClose={() => setOpen(false)}
          onConfirm={(added, skipped) => {
            onConfirm?.(added, skipped);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

type LineSelectorModalProps = {
  moduloKey: ModuloKey;
  showStockRef: boolean;
  themeClass?: string;
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

const getModuleButtonClasses = (key: ModuloKey) => {
  switch (key) {
    case "devoluciones":
      return "bg-devoluciones-light-primary dark:bg-devoluciones-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-devoluciones-light-primary dark:focus:ring-devoluciones-dark-primary";
    case "pedido":
      return "bg-pedido-light-primary dark:bg-pedido-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pedido-light-primary dark:focus:ring-pedido-dark-primary";
    case "inventario":
      return "bg-inventario-light-primary dark:bg-inventario-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-inventario-light-primary dark:focus:ring-inventario-dark-primary";
    case "comparador":
      return "bg-comparador-light-primary dark:bg-comparador-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-comparador-light-primary dark:focus:ring-comparador-dark-primary";
    default:
      return "bg-gray-500 dark:bg-gray-700 text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-700"; // Default neutral color
  }
};

/**
 * Modal de selección por línea:
 * Paso 1: elegir línea (única).
 * Paso 2: listar productos de esa línea (orden por código asc), buscador por nombre,
 *         selección manual con checkbox; columnas: Código, Nombre, Stock ref.
 * Confirmar: agrega a la lista del módulo (evitar duplicados por código).
 */
function LineSelectorModal({ moduloKey, showStockRef, themeClass, onClose, onConfirm }: LineSelectorModalProps) {
  // Store
  const lista = useAppStore((s) => {
    switch (moduloKey) {
      case "inventario":
        return s.listas.inventario;
      case "precios":
        return s.listas.precios;
      case "devoluciones":
        return s.listas.devoluciones;
      case "pedido":
        return s.listas.pedido;
      default:
        return [];
    }
  });

  const agregarProductoToLista = useAppStore((s) => s.agregarProductoToLista);

  // Carga de productos
  const { data, error, loading } = useProductosLocal();

  // Paso 1: Línea seleccionada
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);

  // Paso 2: Filtro por nombre y selección de productos
  const [searchNombre, setSearchNombre] = useState("");
  const [selectedCodigos, setSelectedCodigos] = useState<Set<string>>(new Set());

  const lineas = useMemo(() => (data ? getUniqueSortedLineas(data) : []), [data]);
  const variant = moduloKey === 'precios' ? 'comparador' : moduloKey;

  const productosDeLinea = useMemo(() => {
    if (!data || !selectedLinea) return [];
    const base = data.filter((p) => (p.linea ?? "").toString().trim() === selectedLinea);
    const ordenados = sortByCodigoAsc(base);
    if (!searchNombre.trim()) return ordenados;
    const term = normalize(searchNombre.trim());
    return ordenados.filter((p: ProductoLocal) => normalize(p.nombre ?? "").includes(term));
  }, [data, selectedLinea, searchNombre]);

  const toggleCodigo = (codigo: string) => {
    setSelectedCodigos((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  const isChecked = (codigo: string) => selectedCodigos.has(codigo);

  const handleConfirm = () => {
    if (!data) return;
    // Productos seleccionados por código
    const seleccionados = productosDeLinea.filter((p) => selectedCodigos.has(String(p.codigo)));

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

    // Notificar resultado hacia arriba para que se pueda generar un toast/alerta
    onConfirm(nuevos, duplicados);
  };

  // Accesibilidad: cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Seleccionar productos por línea"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative surface surface-border rounded-md shadow-lg max-w-2xl w-[92%] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div
          className={cn(
            "p-4 border-b",
            // Subrayado/acento por módulo: agrega una línea inferior del color del módulo si viene themeClass
            themeClass?.includes("btn-module-inventario") ? "border-b-2 border-green-500" :
            themeClass?.includes("btn-module-comparador") ? "border-b-2 border-orange-500" :
            themeClass?.includes("btn-module-devoluciones") ? "border-b-2 border-red-500" :
            themeClass?.includes("btn-module-pedido") ? "border-b-2 border-blue-500" :
            ""
          )}
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className={cn("text-xl font-bold", themeClass?.includes("title-") ? themeClass.split(" ").find(c => c.startsWith("title-")) : undefined)}>Seleccionar por línea</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="text-[var(--fg)] hover:opacity-80"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body con scroll interno */}
        <div className="p-4 overflow-auto">
          {/* Paso 1: Selección de línea */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold" htmlFor="linea-sel">
              Línea
            </label>
            <StyledSelect
              id="linea-sel"
              value={selectedLinea ?? ""}
              onChange={(e) => {
                setSelectedLinea(e.target.value || null);
                // Reset selección de productos al cambiar línea
                setSelectedCodigos(new Set());
              }}
              variant={variant}
            >
              <option value="">Seleccione una línea</option>
              {lineas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </StyledSelect>
          </div>

          {/* Paso 2: Productos de la línea */}
          <div className="mb-3">
            <label className="block mb-2 font-semibold" htmlFor="buscador-nombre">
              Buscar por nombre
            </label>
            <input
              id="buscador-nombre"
              type="text"
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              className="input w-full"
              placeholder="Filtrar por nombre..."
              aria-label="Buscar producto por nombre"
            />
          </div>

          {/* Estado de carga / error */}
          {loading && <p className="text-sm opacity-80">Cargando productos...</p>}
          {error && <p className="text-sm text-red-600">Error: {error}</p>}

          {/* Tabla de productos */}
          {!loading && !error && selectedLinea && (
            <div className="overflow-auto border rounded" style={{ borderColor: "var(--border)" }}>
              <table className="min-w-full">
                <thead className="surface-contrast">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center text-[11px] md:text-xs font-bold uppercase tracking-wider">
                      Sel.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider">
                      Nombre
                    </th>
                    {showStockRef && (
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider">
                        Stock Ref.
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productosDeLinea.map((p: ProductoLocal) => {
                    const codigo = String(p.codigo);
                    return (
                      <tr key={codigo} className="hover:opacity-95">
                        <td className="w-10 px-2 py-2 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${p.nombre ?? codigo}`}
                            checked={isChecked(codigo)}
                            onChange={() => toggleCodigo(codigo)}
                            className="align-middle"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{codigo}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm truncate max-w-[240px]" title={p.nombre}>
                          {p.nombre}
                        </td>
                        {showStockRef && (
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                            {typeof p.stock_referencial === "number" ? p.stock_referencial : "-"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {productosDeLinea.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-sm opacity-80" colSpan={4}>
                        No hay productos para la línea seleccionada con el filtro actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border hover:opacity-90"
            style={{ borderColor: "var(--border)" }}
            aria-label="Cancelar selección"
            title="Cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLinea || selectedCodigos.size === 0}
            className={cn(
              getModuleButtonClasses(moduloKey), // Use the helper function
              !selectedLinea || selectedCodigos.size === 0 ? "opacity-60 cursor-not-allowed" : ""
            )}
            aria-label="Agregar seleccionados"
            title="Agregar seleccionados"
          >
            Agregar seleccionados
          </button>
        </div>
      </div>
    </div>
  );
}

export default LineSelectorModal;
