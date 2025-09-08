import React from 'react';
import { TextField } from '@mui/material';
import { styled, type PaletteColor } from '@mui/material/styles';


type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';

interface ModuleTextFieldProps extends Omit<React.ComponentProps<typeof TextField>, 'color'> {
  module: ModuleVariant;
}

const StyledModuleTextField = styled(TextField)<{ module: ModuleVariant }>(({ theme, module }) => {
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
    
    '& .MuiFormHelperText-root': {
      fontSize: '0.75rem',
      marginTop: theme.spacing(0.5),
      
      '&.Mui-error': {
        color: theme.palette.error.main,
      }
    },
    
    '& .MuiInputBase-input': {
      fontSize: '0.875rem',
      color: theme.palette.text.primary,
      padding: theme.spacing(1, 1.5),
      
      '&::placeholder': {
        color: theme.palette.grey[500],
        opacity: 1,
      }
    }
  };
});

export const ModuleTextField: React.FC<ModuleTextFieldProps> = ({
  module,
  variant = 'outlined',
  size = 'small',
  ...props
}) => {
  return (
    <StyledModuleTextField
      variant={variant}
      size={size}
      module={module}
      {...props}
    />
  );
};

export default ModuleTextField;