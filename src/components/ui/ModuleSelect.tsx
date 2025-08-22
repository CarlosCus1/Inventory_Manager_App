import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { styled, type PaletteColor } from '@mui/material/styles';


type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador' | 'default';

interface ModuleSelectProps extends Omit<React.ComponentProps<typeof Select>, 'color' | 'onChange' | 'variant'> {
  module: ModuleVariant;
  label?: string;
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
  onChange?: (event: SelectChangeEvent<string | number>, child: React.ReactNode) => void;
}

const StyledFormControl = styled(FormControl)<{ module: ModuleVariant }>(({ theme, module }) => {
  const colors = (module === 'default' ? theme.palette.primary : theme.palette[module as keyof typeof theme.palette]) as PaletteColor;
  
  return {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.grey[100],
      borderRadius: theme.shape.borderRadius,
      fontSize: '0.875rem',
      height: '40px',
      
      '& fieldset': {
        borderColor: theme.palette.grey[300],
        borderWidth: '1px',
      },
      
      '&:hover fieldset': {
        borderColor: colors?.main || theme.palette.primary.main,
      },
      
      '&.Mui-focused fieldset': {
        borderColor: colors?.main || theme.palette.primary.main,
        borderWidth: '2px',
      },
      
      '&.Mui-error fieldset': {
        borderColor: theme.palette.error.main,
      },
      
      '&.Mui-disabled': {
        backgroundColor: theme.palette.grey[50],
        
        '& fieldset': {
          borderColor: theme.palette.grey[200],
        }
      }
    },
    
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.palette.text.primary,
      
      '&.Mui-focused': {
        color: colors?.main || theme.palette.primary.main,
      },
      
      '&.Mui-error': {
        color: theme.palette.error.main,
      }
    },
    
    '& .MuiSelect-select': {
      fontSize: '0.875rem',
      color: theme.palette.text.primary,
      padding: theme.spacing(1, 1.5),
    },
    
    '& .MuiSelect-icon': {
      color: theme.palette.grey[600],
      
      '.Mui-focused &': {
        color: colors?.main || theme.palette.primary.main,
      }
    }
  };
});

export const ModuleSelect: React.FC<ModuleSelectProps> = ({
  module,
  label,
  options = [],
  children,
  onChange, // Destructure onChange
  ...props
}) => {
  const labelId = `${module}-select-label-${Math.random().toString(36).substr(2, 9)}`;

  const handleSelectChange = (event: SelectChangeEvent<string | number>, child: React.ReactNode) => {
    if (onChange) {
      // Create a simplified ChangeEvent that matches React.ChangeEvent<HTMLInputElement>
      // This assumes the consumer only cares about event.target.name and event.target.value
      const syntheticEvent: React.ChangeEvent<HTMLInputElement> = {
        target: {
          name: event.target.name,
          value: event.target.value as string,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent as SelectChangeEvent<string | number>, child); // Pass the simplified event
    }
  };

  return (
    <StyledFormControl fullWidth size="small" module={module}>
      {label && (
        <InputLabel id={labelId}>{label}</InputLabel>
      )}
      <Select
        labelId={label ? labelId : undefined}
        label={label}
        variant="outlined"
        onChange={handleSelectChange} // Use the wrapper function
        {...props}
      >
        {options.length > 0 && options.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        {children}
      </Select>
    </StyledFormControl>
  );
};

export default ModuleSelect;