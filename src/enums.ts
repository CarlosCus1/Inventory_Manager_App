// Module types for the inventory management system
export enum ModuleType {
  DEVOLUCIONES = 'devoluciones',
  PEDIDO = 'pedido', 
  INVENTARIO = 'inventario',
  COMPARADOR = 'comparador',

}

// Module colors for UI theming
export enum ModuleColor {
  DEVOLUCIONES = '#DC2626',
  PEDIDO = '#2563EB',
  INVENTARIO = '#16A34A', 
  COMPARADOR = '#EA580C',

}

// Animation duration types
export enum AnimationDuration {
  FAST = '200ms',
  NORMAL = '300ms',
  SLOW = '500ms',
  VERY_SLOW = '1000ms'
}