import React from 'react';
import { StyledInput, type InputProps } from './StyledInput';
import { FormGroup, Label } from './FormControls';

// Get the variant type from InputProps
type VariantProp = InputProps['variant'];

interface SucursalInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant: VariantProp;
  name?: string;
  id?: string;
}

export const SucursalInput: React.FC<SucursalInputProps> = ({
  value,
  onChange,
  variant,
  name = "sucursal",
  id = "sucursal"
}) => {
  return (
    <FormGroup>
      <Label htmlFor={id}>Sucursal</Label>
      <StyledInput
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="Ej: Sede Central, Almacén Principal"
        variant={variant}
      />
    </FormGroup>
  );
};
