import React from 'react';
import { Button } from '@mui/material';
import { styled, type PaletteColor } from '@mui/material/styles';


type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador' | 'default';

interface ModuleButtonProps extends Omit<React.ComponentProps<typeof Button>, 'color'> {
  variant?: 'contained' | 'outlined' | 'text';
  module: ModuleVariant;
  size?: 'small' | 'medium' | 'large';
}

const StyledModuleButton = styled(Button)<{ module: ModuleVariant }>(({ theme, module }) => {
  const colors = (module === 'default' ? theme.palette.primary : theme.palette[module as keyof typeof theme.palette]) as PaletteColor;
  
  return {
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightMedium,
    transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'transform'], {
      duration: theme.transitions.duration.short,
    }),
    
    '&.MuiButton-contained': {
      backgroundColor: colors?.main || theme.palette.primary.main,
      color: colors?.contrastText || theme.palette.primary.contrastText,
      boxShadow: theme.shadows[2],
      
      '&:hover': {
        backgroundColor: colors?.dark || theme.palette.primary.dark,
        boxShadow: theme.shadows[4],
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: theme.shadows[2],
      },
      
      '&:disabled': {
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.grey[500],
        boxShadow: 'none',
        transform: 'none',
      }
    },
    
    '&.MuiButton-outlined': {
      borderColor: colors?.main || theme.palette.primary.main,
      color: colors?.main || theme.palette.primary.main,
      backgroundColor: 'transparent',
      
      '&:hover': {
        borderColor: colors?.dark || theme.palette.primary.dark,
        backgroundColor: `${colors?.main || theme.palette.primary.main}08`,
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
      },
      
      '&:disabled': {
        borderColor: theme.palette.grey[300],
        color: theme.palette.grey[400],
        transform: 'none',
      }
    },
    
    '&.MuiButton-text': {
      color: colors?.main || theme.palette.primary.main,
      backgroundColor: 'transparent',
      
      '&:hover': {
        backgroundColor: `${colors?.main || theme.palette.primary.main}08`,
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
      },
      
      '&:disabled': {
        color: theme.palette.grey[400],
        transform: 'none',
      }
    }
  };
});

export const ModuleButton: React.FC<ModuleButtonProps> = ({
  module,
  variant = 'contained',
  size = 'medium',
  children,
  ...props
}) => {
  return (
    <StyledModuleButton
      variant={variant}
      size={size}
      module={module}
      {...props}
    >
      {children}
    </StyledModuleButton>
  );
};

export default ModuleButton;