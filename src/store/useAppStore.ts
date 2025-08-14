
// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/store/useAppStore.ts                              #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import { create } from 'zustand';
// Middleware de Zustand para persistir parte del estado en un almacenamiento.
import { persist, createJSONStorage } from 'zustand/middleware';
// Interfaces de datos que hemos definido.
import type { IForm, IProducto, IProductoEditado } from '../interfaces';
import { consultarRuc, fetchHolidays } from '../utils/api';
type MotivoDevolucion = 'falla_fabrica' | 'acuerdos_comerciales';

// --- Tipos Adicionales ---
type Theme = 'light' | 'dark';

// --- 2. Definición de la forma del Estado (State) ---
// Esta interfaz define todos los datos que nuestro store va a manejar.
interface State {
  // Tema actual de la aplicación (claro u oscuro).
  theme: Theme;
  // Catálogo completo de productos, cargado desde el JSON.
  catalogo: IProducto[];
  // Estado de los formularios. Será la parte que persistiremos en localStorage.
  formState: {
    // Un objeto para cada tipo de formulario, para mantenerlos separados.
    devoluciones: IForm & { motivo?: MotivoDevolucion };
    pedido: IForm;
    inventario: IForm;
    precios: IForm;
    planificador: IForm;
  };
  // Listas de productos para cada módulo.
  listas: {
    devoluciones: IProductoEditado[];
    pedido: IProductoEditado[];
    inventario: IProductoEditado[];
    precios: IProductoEditado[];
    planificador: IProductoEditado[];
  };
  // Indica si el catálogo de productos se está cargando.
  loading: boolean;
  // Para almacenar cualquier error que pueda ocurrir.
  error: string | null;
  // Cache para RUC y Feriados
  rucCache: Record<string, any>;
  holidays: any[];
}

// --- 3. Definición de las Acciones (Actions) ---
// Interfaz que define todas las funciones que pueden modificar el estado.
interface Actions {
  // Cambia el tema entre 'light' y 'dark'.
  toggleTheme: () => void;
  // Carga el catálogo de productos desde un archivo JSON.
  cargarCatalogo: () => Promise<void>;
  // Actualiza un campo específico en el estado de un formulario.
  actualizarFormulario: (tipo: keyof State['formState'], campo: keyof IForm, valor: string | number) => void;
  // Setter específico para motivo de devoluciones
  setMotivoDevolucion: (motivo: MotivoDevolucion) => void;
  // Añade un producto a una lista específica.
  agregarProductoToLista: (tipo: keyof State['listas'], producto: IProducto) => void;
  // Actualiza un producto que ya está en una lista.
  actualizarProductoEnLista: (
    tipo: keyof State['listas'],
    codigo: string,
    campo: keyof IProductoEditado,
    valor: string | number | Record<string, number>
  ) => void;
  // Elimina un producto de una lista.
  eliminarProductoDeLista: (tipo: keyof State['listas'], codigo: string) => void;
  // Limpia una lista y el formulario asociado.
  resetearModulo: (tipo: keyof State['listas']) => void;
  // Nuevas acciones para cache
  fetchRuc: (ruc: string) => Promise<any>;
  fetchHolidays: (year: number) => Promise<any[]>;
}

// --- 4. Estado Inicial ---
// Definimos el estado inicial como una constante para poder reutilizarlo,
// especialmente en la acción `resetearModulo`.
const initialState: Omit<State, keyof Actions> = {
  theme: 'light',
  catalogo: [],
  formState: {
    devoluciones: { motivo: 'falla_fabrica' },
    pedido: {},
    inventario: {},
    precios: {},
    planificador: {},
  },
  listas: {
    devoluciones: [],
    pedido: [],
    inventario: [],
    precios: [],
    planificador: [],
  },
  loading: false,
  error: null,
  rucCache: {},
  holidays: [],
};

// --- 5. Creación del Store con Zustand ---
// Se combina `State` y `Actions` para crear el tipo completo del store.
// `create` es la función principal de Zustand para crear el hook del store.
// `persist` es el middleware que envolverá nuestro store para guardar datos.
export const useAppStore = create<State & Actions>()(
  persist(
    // La función `set` es la única forma de modificar el estado.
    // La función `get` permite acceder al estado actual dentro de una acción.
    (set, get) => ({
      ...initialState,

      // --- Implementación de las Acciones ---
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      cargarCatalogo: async () => {
        // Si ya se está cargando o si el catálogo ya tiene datos, no hacer nada.
        if (get().loading || get().catalogo.length > 0) return;

        set({ loading: true, error: null });
        try {
          const url = import.meta.env.VITE_PRODUCTOS_JSON_URL || '/productos_local.json';
          console.log(`Intentando cargar catálogo desde: ${url}`);
          const response = await fetch(url);
          console.log('Respuesta de fetch:', response);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el catálogo de productos. Estado: ${response.status}, Mensaje: ${errorText}`);
          }
          const data: IProducto[] = await response.json();
          console.log('Datos cargados:', data);
          set({ catalogo: data, loading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
          console.error('Error al cargar el catálogo:', error);
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
        // Se comprueba si el producto ya existe en la lista.
        const productoExistente = listaActual.find(p => p.codigo === producto.codigo);

        if (productoExistente) {
          // Si existe, simplemente incrementamos la cantidad.
          get().actualizarProductoEnLista(tipo, producto.codigo, 'cantidad', productoExistente.cantidad + 1);
        } else {
          // Si no existe, lo añadimos a la lista con cantidad 1.
          const nuevoProducto: IProductoEditado = {
            ...producto,
            cantidad: 1,
            observaciones: '',
          };
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
              // Permitir actualizar campos complejos como 'precios' (Record<string, number>)
              if (campo === 'precios' && typeof valor === 'object' && valor !== null) {
                return { ...p, precios: valor as Record<string, number> };
              }
              // Para el resto de campos (string | number)
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
          // Restablecemos la lista correspondiente a su estado inicial (vacío).
          listas: {
            ...state.listas,
            [tipo]: initialState.listas[tipo],
          },
          // Restablecemos el formulario al estado inicial definido en `initialState`.
          // Esto asegura que los valores por defecto (como el motivo en devoluciones) se restauren correctamente.
          formState: {
            ...state.formState,
            [tipo]: initialState.formState[tipo],
          }
        }));
      },

      fetchRuc: async (ruc) => {
        const cache = get().rucCache;
        if (cache[ruc]) {
          return cache[ruc];
        }
        const data = await consultarRuc(ruc);
        set(state => ({
          rucCache: {
            ...state.rucCache,
            [ruc]: data,
          }
        }));
        return data;
      },

      fetchHolidays: async (year) => {
        const holidays = get().holidays;
        // A simple check if holidays for any year are already loaded.
        // A more robust implementation would check for the specific year.
        if (holidays.length > 0) {
          return holidays;
        }
        const data = await fetchHolidays(year);
        set({ holidays: data });
        return data;
      }
    }),
    {
      // --- Configuración de la Persistencia ---
      // Nombre de la clave bajo la cual se guardará el estado en localStorage.
      name: 'app-storage',
      // Se especifica qué parte del estado queremos persistir.
      // En este caso, `formState` y `theme`. El catálogo y las listas no se guardan.
      partialize: (state) => ({ formState: state.formState, theme: state.theme, listas: state.listas }),
      // Se especifica que el almacenamiento a usar es `localStorage`.
      storage: createJSONStorage(() => localStorage),
    }
  )
);
