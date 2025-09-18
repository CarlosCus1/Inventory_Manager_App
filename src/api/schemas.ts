import { z } from 'zod';
import { FormSchema, ProductoEditadoSchema } from '../interfaces';

// Esquema para el usuario
const UsuarioSchema = z.object({
  nombre: z.string(),
  correo: z.string().email(),
});

// Esquema base para la petición de exportación
const ExportBaseSchema = z.object({
  list: z.array(ProductoEditadoSchema),
  usuario: UsuarioSchema,
});

// Esquema específico para el reporte de Inventario
export const InventarioExportSchema = ExportBaseSchema.extend({
  tipo: z.literal('inventario'),
  form: FormSchema, // Usamos el FormSchema general
});

// Esquema específico para el reporte de Pedido
export const PedidoExportSchema = ExportBaseSchema.extend({
  tipo: z.literal('pedido'),
  form: FormSchema,
});

// Esquema específico para el reporte de Devoluciones
export const DevolucionesExportSchema = ExportBaseSchema.extend({
  tipo: z.literal('devoluciones'),
  form: FormSchema.extend({
    motivo: z.string().min(1, 'El motivo es requerido para devoluciones.'),
  }),
});

// Esquema específico para el reporte de Precios
export const PreciosExportSchema = ExportBaseSchema.extend({
  tipo: z.literal('precios'),
  form: FormSchema.extend({
    marca1: z.string().min(1, 'La Marca 1 es requerida.'),
    marca2: z.string().min(1, 'La Marca 2 es requerida.'),
  }),
});

// Inferred types
export type InventarioExport = z.infer<typeof InventarioExportSchema>;
export type PedidoExport = z.infer<typeof PedidoExportSchema>;
export type DevolucionesExport = z.infer<typeof DevolucionesExportSchema>;
export type PreciosExport = z.infer<typeof PreciosExportSchema>;
export type ProductoEditado = z.infer<typeof ProductoEditadoSchema>;
