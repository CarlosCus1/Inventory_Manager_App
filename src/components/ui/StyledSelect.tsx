import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  'select', // Use the global select class
  {
    variants: {
      variant: {
        devoluciones: 'border-red-300 focus:ring-red-500 focus:border-red-500',
        pedido: 'border-blue-300 focus:ring-blue-500 focus:border-blue-500',
        inventario: 'border-green-300 focus:ring-green-500 focus:border-green-500',
        comparador: 'border-orange-300 focus:ring-orange-500 focus:border-orange-500',
        planificador: 'border-sky-300 focus:ring-sky-500 focus:border-sky-500', // Changed to purple
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
