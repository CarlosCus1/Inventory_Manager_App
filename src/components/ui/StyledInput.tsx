import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        devoluciones: 'border-red-300 focus:ring-red-500 focus:border-red-500',
        pedido: 'border-blue-300 focus:ring-blue-500 focus:border-blue-500',
        inventario: 'border-green-300 focus:ring-green-500 focus:border-green-500',
        comparador: 'border-orange-300 focus:ring-orange-500 focus:border-orange-500',
        planificador: 'border-sky-300 focus:ring-sky-500 focus:border-sky-500',
        default: 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

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
