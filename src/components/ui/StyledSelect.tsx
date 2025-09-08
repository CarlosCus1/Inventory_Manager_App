import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  'w-full px-3 py-0 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 select bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50', // Combined base and global class
  {
    variants: {
      variant: {
        devoluciones: 'border-devoluciones-light-secondary focus:ring-devoluciones-light-primary focus:border-devoluciones-light-primary',
        pedido: 'border-pedido-light-secondary focus:ring-pedido-light-primary focus:border-pedido-light-primary',
        inventario: 'border-inventario-light-secondary focus:ring-inventario-light-primary focus:border-inventario-light-primary',
        comparador: 'border-comparador-light-secondary focus:ring-comparador-light-primary focus:border-comparador-light-primary',
        // Note: 'precios' variant in StyledSelect was using 'purple-300'.
        // Since 'precios' maps to 'comparador' in DatosGeneralesForm,
        // I'll align 'precios' here with 'comparador' colors for consistency.
        // If 'precios' needs a distinct color, it should be defined in muiTheme.ts and tailwind.config.js
        precios: 'border-comparador-light-secondary focus:ring-comparador-light-primary focus:border-comparador-light-primary',
        default: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

const StyledSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <select
        className={selectVariants({ variant, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

StyledSelect.displayName = 'StyledSelect';

export { StyledSelect };