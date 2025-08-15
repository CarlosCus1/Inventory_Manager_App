
// --------------------------------------------------------------------------- #
//
//                            src/interfaces.ts
//                                                                             #
// --------------------------------------------------------------------------- #

import { z } from 'zod';

/**
 * @description Zod schema for a competitor.
 */
export const CompetenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre del competidor es requerido.'),
});

/** @type ICompetencia - Inferred type for a competitor. */
export type ICompetencia = z.infer<typeof CompetenciaSchema>;

/**
 * @description Zod schema for a base product.
 */
export const ProductoSchema = z.object({
  /** Identificador único del producto. */
  codigo: z.string().min(1, 'El código es requerido.'),

  /** Código de barras EAN del producto. */
  cod_ean: z.string(),

  /** Nombre descriptivo del producto. */
  nombre: z.string().min(1, 'El nombre es requerido.'),

  /** Categoría o línea a la que pertenece el producto. */
  linea: z.string(),

  /** Peso del producto, generalmente en kilogramos. */
  peso: z.number().nonnegative('El peso no puede ser negativo.'),

  /** Cantidad de stock disponible como referencia. */
  stock_referencial: z.number().int('El stock debe ser un número entero.').nonnegative(),

  /** Palabras clave para facilitar la búsqueda del producto. */
  keywords: z.array(z.string()),
});

/** @type IProducto - Inferred type for a base product. */
export type IProducto = z.infer<typeof ProductoSchema>;

/**
 * @description Zod schema for an edited product, extending the base product.
 */
export const ProductoEditadoSchema = ProductoSchema.extend({
  /** La cantidad del producto que se está gestionando. */
  cantidad: z.number().int('La cantidad debe ser un número entero.').positive('La cantidad debe ser mayor a cero.'),

  /** Notas o comentarios adicionales sobre el producto en la lista. */
  observaciones: z.string().optional(),

  /** Un objeto para almacenar los precios de la competencia. */
  precios: z.record(z.string(), z.number()).optional(),
});

/** @type IProductoEditado - Inferred type for an edited product. */
export type IProductoEditado = z.infer<typeof ProductoEditadoSchema>;

/**
 * @description Zod schema for the general form data.
 * Provides runtime validation and an inferred TypeScript type from a single source of truth.
 * All fields are optional to handle different forms across the application.
 */
export const FormSchema = z.object({
  /** Nombre del cliente (usado en Devoluciones, Pedidos). */
  cliente: z.string().optional(),

  /** Documento del cliente (RUC/DNI). */
  documento_cliente: z.string().optional(),

  /** Código del cliente (opcional, usado en Devoluciones, Pedidos). */
  codigo_cliente: z.string().optional(),

  /** Fecha de la operación (común a todos los módulos). */
  fecha: z.string().optional(),

  /** Nombre del colaborador o personal (usado en Inventario, Comparador). */
  colaborador_personal: z.string().optional(),

  /** Nombre de la Marca 1 para comparación de precios. */
  marca1: z.string().optional(),

  /** Nombre de la Marca 2 para comparación de precios. */
  marca2: z.string().optional(),

  /** Nombre de la Marca 3 para comparación de precios. */
  marca3: z.string().optional(),

  /** Nombre de la Marca 4 para comparación de precios. */
  marca4: z.string().optional(),

  /** Nombre de la Marca 5 para comparación de precios. */
  marca5: z.string().optional(),

  /** Sucursal de la operación (usado en Devoluciones, Pedido, Inventario, Comparador). */
  sucursal: z.string().optional(),

  /** Código del pedido asociado al planificador. */
  pedido_planificador: z.string().optional(),

  /** Color de línea seleccionado en el planificador para el reporte XLSX. */
  linea_planificador_color: z.string().optional(),

  /** Monto total del planificador. */
  montoOriginal: z.number().optional(),
});

/**
 * @type IForm
 * @description Defines the structure of the general form data, inferred from the Zod schema.
 */
export type IForm = z.infer<typeof FormSchema>;
