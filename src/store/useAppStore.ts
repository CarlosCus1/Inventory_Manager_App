// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/store/useAppStore.ts                              #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveCatalogToIndexedDB } from '../utils/indexedDb';
import type { IForm, IProducto, IProductoEditado, RucData } from '../interfaces';
import { consultarRucApi } from '../utils/api';
type MotivoDevolucion = 'falla_fabrica' | 'acuerdos_comerciales';

// --- Tipos Adicionales ---

interface ModuleStats {
  devoluciones: number;
  pedido: number;
  inventario: number;
  precios: number; // Renombrado de 'comparador' a 'precios' para consistencia
}

interface RawProduct {
  codigo?: string | number;
  nombre?: string;
  ean?: string;
  ean_14?: string;
  linea?: string;
  can_kg_um?: number;
  stock_referencial?: number;
  precio?: number;
  u_por_caja?: number;
  keywords?: string;
}


// --- 2. Definición de la forma del Estado (State) ---
export interface State {
  catalogo: IProducto[];
  moduleUsage: ModuleStats;
  incompleteTasks: number;
  lastActivity: { [key: string]: Date };
  formState: {
    devoluciones: IForm & { motivo?: MotivoDevolucion };
    pedido: IForm;
    inventario: IForm;
    precios: IForm;
  };
  listas: {
    devoluciones: IProductoEditado[];
    pedido: IProductoEditado[];
    inventario: IProductoEditado[];
    precios: IProductoEditado[];
  };
  loading: boolean;
  error: string | null;
  rucCache: Record<string, unknown>;
  theme: 'light' | 'dark';
}

// --- 3. Definición de las Acciones (Actions) ---
interface Actions {
  updateModuleUsage: (module: keyof ModuleStats) => void;
  addIncompleteTask: () => void;
  completeTask: () => void;
  recordActivity: (module: keyof ModuleStats) => void;
  cargarCatalogo: () => Promise<void>;
  actualizarFormulario: (tipo: keyof State['formState'], campo: keyof IForm, valor: string | number) => void;
  setMotivoDevolucion: (motivo: MotivoDevolucion) => void;
  agregarProductoToLista: (tipo: keyof State['listas'], producto: IProducto) => void;
  actualizarProductoEnLista: <K extends keyof IProductoEditado>(
    tipo: keyof State['listas'],
    codigo: string,
    campo: K,
    valor: IProductoEditado[K]
  ) => void;
  eliminarProductoDeLista: (tipo: keyof State['listas'], codigo: string) => void;
  resetearModulo: (tipo: keyof State['listas']) => void;
  fetchRuc: (ruc: string) => Promise<RucDota>;
  setTheme: (theme: 'light' | 'dark') => void;
}

// --- 4. Estado Inicial ---
const initialState: Omit<State, keyof Actions> = {
  catalogo: [],
  moduleUsage: {
    devoluciones: 75,
    pedido: 90,
    inventario: 60,
    precios: 45,
  },
  incompleteTasks: 5,
  lastActivity: {},
  formState: {
    devoluciones: {} as IForm & { motivo?: MotivoDevolucion },
    pedido: {} as IForm,
    inventario: {} as IForm,
    precios: {} as IForm,
  },
  listas: {
    devoluciones: [],
    pedido: [],
    inventario: [],
    precios: [],
  },
  loading: false,
  error: null,
  rucCache: {},
  theme: 'light',
};

// --- 5. Adaptador de Datos para el nuevo JSON de productos ---
const mapRawProductToIProducto = (rawProduct: RawProduct): IProducto => {
  return {
    codigo: String(rawProduct.codigo || ''),
    nombre: rawProduct.nombre || '',
    cod_ean: rawProduct.ean || '',
    ean_14: rawProduct.ean_14 || '',
    linea: rawProduct.linea || '',
    peso: rawProduct.can_kg_um || 0,
    stock_referencial: rawProduct.stock_referencial || 0,
    precio_referencial: rawProduct.precio || 0,
    cantidad_por_caja: rawProduct.u_por_caja || 0,
    keywords: (rawProduct.keywords || '').trim().split(/\s+/).filter(Boolean),
  };
};


// --- 6. Creación del Store con Zustand ---
export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Implementación de las Acciones ---

      cargarCatalogo: async () => {
        if (get().loading || get().catalogo.length > 0) return;

        set({ loading: true, error: null });
        try {
          

          const url = import.meta.env.VITE_PRODUCTOS_JSON_URL || '/productos_local.json';
          // console.log(`Intentando cargar catálogo desde la red: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el catálogo de productos. Estado: ${response.status}, Mensaje: ${errorText}`);
          }
          const rawData: RawProduct[] = await response.json();
          // console.log('Datos crudos cargados desde la red:', rawData);

          // Adaptar los datos crudos al formato IProducto
          const mappedData = rawData.map(mapRawProductToIProducto);
          // console.log('Datos adaptados:', mappedData);

          await saveCatalogToIndexedDB(mappedData);
          // console.log('Catálogo adaptado y guardado en IndexedDB.');

          set({ catalogo: mappedData, loading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
          // console.error('Error al cargar el catálogo:', error);
          set({ error: errorMessage, loading: false });
        }
      },

      actualizarFormulario: (tipo, campo, valor) => {
        set((state) => ({
          formState: {
            ...state.formState,
            [tipo]: {
              ...state.formState[tipo],
              [campo]: valor,
            },
          },
        }));
      },

      setMotivoDevolucion: (motivo: MotivoDevolucion) => {
        set((state) => ({
          formState: {
            ...state.formState,
            devoluciones: {
              ...state.formState.devoluciones,
              motivo,
            },
          },
        }));
      },

      agregarProductoToLista: (tipo, producto) => {
        const listaActual = get().listas[tipo];
        const productoExistente = listaActual.find(p => p.codigo === producto.codigo);

        if (productoExistente) {
          get().actualizarProductoEnLista(tipo, producto.codigo, 'cantidad', productoExistente.cantidad + 1);
        } else {
          // Aseguramos que el campo peso siempre sea un número válido
          const peso = producto.peso !== undefined ? Number(producto.peso) : 0;
          let nuevoProducto: IProductoEditado = {
            ...producto,
            peso,
            cantidad: 1,
            observaciones: '',
          };
          // En el comparador, los precios y el precio sugerido deben ser manuales
          if (tipo === 'precios') {
            nuevoProducto = {
              ...nuevoProducto,
              precios: {},
              precio_sugerido: undefined,
            };
          } else {
            nuevoProducto = {
              ...nuevoProducto,
              precio_sugerido: producto.precio_referencial ?? 0,
            };
          }
          set((state) => ({
            listas: {
              ...state.listas,
              [tipo]: [...state.listas[tipo], nuevoProducto],
            },
          }));
        }
      },

      actualizarProductoEnLista: <K extends keyof IProductoEditado>(
        tipo: keyof State['listas'],
        codigo: string,
        campo: K,
        valor: IProductoEditado[K]
      ) => {
        set((state) => ({
          listas: {
            ...state.listas,
            [tipo]: state.listas[tipo].map((p) => {
              if (p.codigo !== codigo) return p;
              // Special handling for numeric conversions
              if (campo === 'cantidad' || campo === 'precio_sugerido') {
                const numericValue = typeof valor === 'string' ? parseInt(valor, 10) : valor;
                return { ...p, [campo]: isNaN(numericValue as number) ? 0 : numericValue };
              }
              return { ...p, [campo]: valor };
            }),
          },
        }));
      },

      eliminarProductoDeLista: (tipo, codigo) => {
        set((state) => ({
          listas: {
            ...state.listas,
            [tipo]: state.listas[tipo].filter((p) => p.codigo !== codigo),
          },
        }));
      },

      resetearModulo: (tipo) => {
        set((state) => ({
          formState: {
            ...state.formState,
            [tipo]: initialState.formState[tipo],
          }
        }));
      },

      fetchRuc: async (ruc) => {
        const cache = get().rucCache;
        if (cache[ruc]) {
          return cache[ruc] as RucData;
        }
        const data = await consultarRucApi(ruc);
        set(state => ({
          rucCache: {
            ...state.rucCache,
            [ruc]: data,
          }
        }));
        return data;
      },


      updateModuleUsage: (module: keyof ModuleStats) => set((state) => ({
        moduleUsage: {
          ...state.moduleUsage,
          [module]: Math.min(100, state.moduleUsage[module] + Math.random() * 10)
        }
      })),

      recordActivity: (module: keyof ModuleStats) => set((state) => ({
        lastActivity: {
          ...state.lastActivity,
          [module]: new Date()
        }
      })),

      addIncompleteTask: () => set((state) => ({
        incompleteTasks: state.incompleteTasks + 1
      })),

      completeTask: () => set((state) => ({
        incompleteTasks: Math.max(0, state.incompleteTasks - 1)
      })),

      setTheme: (theme: 'light' | 'dark') => set(() => ({
        theme: theme
      }))
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        formState: state.formState,
        listas: state.listas,
        moduleUsage: state.moduleUsage,
        incompleteTasks: state.incompleteTasks,
        lastActivity: state.lastActivity,
        theme: state.theme,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);