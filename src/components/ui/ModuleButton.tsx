import React from 'react';
import { Button } from '@mui/material';
import { styled, type PaletteColor, type Palette } from '@mui/material/styles';

// Augment the theme's palette type locally for correct access
interface CustomPalette extends Palette {
  devoluciones: PaletteColor;
  pedido: PaletteColor;
  inventario: PaletteColor;
  comparador: PaletteColor;
  planificador: PaletteColor;
}

type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador' | 'default';

interface ModuleButtonProps extends Omit<React.ComponentProps<typeof Button>, 'color'> {
  variant?: 'contained' | 'outlined' | 'text';
  module: ModuleVariant;
  size?: 'small' | 'medium' | 'large';
}

const StyledModuleButton = styled(Button)<{ module: ModuleVariant }>(({ theme, module }) => {
  const customPalette = theme.palette as CustomPalette;
  const colors = (module === 'default' ? customPalette.primary : customPalette[module]) as PaletteColor;

  return {
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightMedium,
    transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'transform'], {
      duration: theme.transitions.duration.short,
    }),

    '&.MuiButton-contained': {
      backgroundColor: colors?.main || customPalette.primary.main,
      color: colors?.contrastText || customPalette.primary.contrastText,
      boxShadow: theme.shadows[2],

      '&:hover': {
        backgroundColor: colors?.dark || customPalette.primary.dark,
        boxShadow: theme.shadows[4],
        transform: 'translateY(-1px)',
      },

      '&:active': {
        transform: 'translateY(0)',
        boxShadow: theme.shadows[2],
      },

      '&:disabled': {
        backgroundColor: customPalette.grey[300],
        color: customPalette.grey[500],
        boxShadow: 'none',
        transform: 'none',
      }
    },

    '&.MuiButton-outlined': {
      borderColor: colors?.main || customPalette.primary.main,
      color: colors?.main || customPalette.primary.main,
      backgroundColor: 'transparent',

      '&:hover': {
        borderColor: colors?.dark || customPalette.primary.dark,
        backgroundColor: `${colors?.main || customPalette.primary.main}08`,
        transform: 'translateY(-1px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },

      '&:disabled': {
        borderColor: customPalette.grey[300],
        color: customPalette.grey[400],
        transform: 'none',
      }
    },

    '&.MuiButton-text': {
      color: colors?.main || customPalette.primary.main,
      backgroundColor: 'transparent',

      '&:hover': {
        backgroundColor: `${colors?.main || customPalette.primary.main}08`,
        transform: 'translateY(-1px)',
      },

      '&:active': {
        transform: 'translateY(0)',
      },

      '&:disabled': {
        color: customPalette.grey[400],
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