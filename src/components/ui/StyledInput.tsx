import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'input', // Use the global input class
  {
    variants: {
      variant: {
        devoluciones: 'border-devoluciones-light-secondary focus:ring-devoluciones-light-primary focus:border-devoluciones-light-primary',
        pedido: 'border-pedido-light-secondary focus:ring-pedido-light-primary focus:border-pedido-light-primary',
        inventario: 'border-inventario-light-secondary focus:ring-inventario-light-primary focus:border-inventario-light-primary',
        comparador: 'border-comparador-light-secondary focus:ring-comparador-light-primary focus:border-comparador-light-primary',
        default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  variant: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';
    }

const StyledInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <input
        className={inputVariants({ variant, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

StyledInput.displayName = 'StyledInput';

export { StyledInput };