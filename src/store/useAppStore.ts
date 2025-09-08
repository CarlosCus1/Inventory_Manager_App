// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/store/useAppStore.ts                              #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCatalogFromIndexedDB, saveCatalogToIndexedDB } from '../utils/indexedDb';
import type { IForm, IProducto, IProductoEditado, RucData } from '../interfaces';
import { consultarRucApi, fetchHolidaysApi } from '../utils/api';
type MotivoDevolucion = 'falla_fabrica' | 'acuerdos_comerciales';

// --- Tipos Adicionales ---
type Theme = 'light' | 'dark';

interface ModuleStats {
  devoluciones: number;
  pedido: number;
  inventario: number;
  comparador: number;
}


// --- 2. Definición de la forma del Estado (State) ---
export interface State {
  theme: Theme;
  catalogo: IProducto[];
  moduleUsage: ModuleStats;
  incompleteTasks: number;
  lastActivity: { [key: string]: Date };
  formState: {
    devoluciones: IForm & { motivo?: MotivoDevolucion };
    pedido: IForm;
    inventario: IForm;
    precios: IForm;
  comparador: IForm;
  };
  listas: {
    devoluciones: IProductoEditado[];
    pedido: IProductoEditado[];
    inventario: IProductoEditado[];
    precios: IProductoEditado[];
  comparador: IProductoEditado[];
  };
  loading: boolean;
  error: string | null;
  rucCache: Record<string, unknown>;
  holidays: Array<{ date: string; name: string }>;
}

// --- 3. Definición de las Acciones (Actions) ---
interface Actions {
  toggleTheme: () => void;
  updateModuleUsage: (module: keyof ModuleStats) => void;
  addIncompleteTask: () => void;
  completeTask: () => void;
  recordActivity: (module: keyof ModuleStats) => void;
  cargarCatalogo: () => Promise<void>;
  actualizarFormulario: (tipo: keyof State['formState'], campo: keyof IForm, valor: string | number) => void;
  setMotivoDevolucion: (motivo: MotivoDevolucion) => void;
  agregarProductoToLista: (tipo: keyof State['listas'], producto: IProducto) => void;
  actualizarProductoEnLista: (
    tipo: keyof State['listas'],
    codigo: string,
    campo: keyof IProductoEditado,
    valor: string | number | Record<string, number>
  ) => void;
  eliminarProductoDeLista: (tipo: keyof State['listas'], codigo: string) => void;
  resetearModulo: (tipo: keyof State['listas']) => void;
  fetchRuc: (ruc: string) => Promise<RucData>;
  fetchHolidays: (year: number) => Promise<Array<{ date: string; name: string }>>;
}

// --- 4. Estado Inicial ---
const initialState: Omit<State, keyof Actions> = {
  theme: 'light',
  catalogo: [],
  moduleUsage: {
    devoluciones: 75,
    pedido: 90,
    inventario: 60,
    comparador: 45,

  },
  incompleteTasks: 5,
  lastActivity: {},
    formState: {
      devoluciones: { motivo: 'falla_fabrica' },
      pedido: {},
      inventario: {},
      precios: {},
      comparador: {},
    },
    listas: {
      devoluciones: [],
      pedido: [],
      inventario: [],
      precios: [],
      comparador: [],
    },
  loading: false,
  error: null,
  rucCache: {},
  holidays: [],
};

// --- 5. Adaptador de Datos para el nuevo JSON de productos ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRawProductToIProducto = (rawProduct: any): IProducto => {
  return {
    codigo: rawProduct.codigo || '',
    nombre: rawProduct.nombre || '',
    cod_ean: rawProduct.ean || '',
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
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      cargarCatalogo: async () => {
        if (get().loading || get().catalogo.length > 0) return;

        set({ loading: true, error: null });
        try {
          const indexedDBCatalog = await getCatalogFromIndexedDB();
          if (indexedDBCatalog && indexedDBCatalog.length > 0) {
            // console.log('Catálogo cargado desde IndexedDB.');
            set({ catalogo: indexedDBCatalog, loading: false });
            return;
          }

          const url = import.meta.env.VITE_PRODUCTOS_JSON_URL || '/productos_local.json';
          // console.log(`Intentando cargar catálogo desde la red: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el catálogo de productos. Estado: ${response.status}, Mensaje: ${errorText}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawData: any[] = await response.json();
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

      actualizarProductoEnLista: (tipo, codigo, campo, valor) => {
        set((state) => ({
          listas: {
            ...state.listas,
            [tipo]: state.listas[tipo].map((p) => {
              if (p.codigo !== codigo) return p;
              if (campo === 'precios' && typeof valor === 'object' && valor !== null) {
                return { ...p, precios: valor as Record<string, number> };
              }
              // Forzar precio_sugerido a número en el comparador y loguear
              if (campo === 'precio_sugerido' && tipo === 'precios') {
                const nuevoValor = typeof valor === 'number' ? valor : Number(valor);
                // console.log(`[Comparador] Guardando precio_sugerido para ${codigo}:`, nuevoValor);
                return { ...p, precio_sugerido: nuevoValor };
              }
              return { ...p, [campo]: valor as string | number };
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
          listas: {
            ...state.listas,
            [tipo]: initialState.listas[tipo],
          },
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

      fetchHolidays: async (year) => {
        const data = await fetchHolidaysApi(year);
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
      }))
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ 
        formState: state.formState, 
        theme: state.theme, 
        listas: state.listas,
        moduleUsage: state.moduleUsage,
        incompleteTasks: state.incompleteTasks,
        lastActivity: state.lastActivity
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);