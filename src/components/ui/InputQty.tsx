import React, { forwardRef } from 'react';

interface SchemaProps {
  minimum?: number;
  maximum?: number;
  step?: number;
  exclusiveMinimum?: number; // Added for completeness, though not directly used in clamping
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  schema: SchemaProps;
  value: number; // Assuming value will always be a number for this component
  onValueChange: (value: number) => void; // New prop for custom change handler
}

export const InputQty = forwardRef<HTMLInputElement, InputProps>(({ 
  schema,
  value,
  onValueChange, // Changed from onChange
  ...props 
}, ref) => {
  const { minimum = 0, maximum, step = 0.01, exclusiveMinimum } = schema;
  
  const effectiveMinimum = exclusiveMinimum !== undefined ? exclusiveMinimum + (step || 0.01) : minimum;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    let clampedValue = newValue;

    if (!isNaN(newValue)) {
      if (effectiveMinimum !== undefined) {
        clampedValue = Math.max(effectiveMinimum, clampedValue);
      }
      if (maximum !== undefined) {
        clampedValue = Math.min(maximum, clampedValue);
      }
    } else {
      clampedValue = effectiveMinimum !== undefined ? effectiveMinimum : minimum;
    }

    onValueChange(clampedValue); // Changed from onChange
  };

  return (
    <input
      {...props}
      ref={ref}
      type="number"
      min={effectiveMinimum}
      max={maximum}
      step={step}
      value={value}
      onChange={handleChange}
      className="input-qty"
    />
  );
});

export default InputQty;