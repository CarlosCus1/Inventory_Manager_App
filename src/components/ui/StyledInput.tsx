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
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  variant?: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';
  compact?: boolean; // when true, apply compact input sizing (44px)
}

const StyledInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, compact = true, ...rest }, ref) => {
  // prevent compact from being forwarded to the DOM as an unknown attribute
  const props = { ...(rest as Record<string, unknown>) } as Record<string, unknown>;
  if ('compact' in props) delete props.compact;

    return (
      <input
        className={`${inputVariants({ variant, className })} ${compact ? 'input-compact' : ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);

StyledInput.displayName = 'StyledInput';

export { StyledInput };