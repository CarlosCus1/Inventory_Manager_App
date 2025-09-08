import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    devoluciones: PaletteColor;
    pedido: PaletteColor;
    inventario: PaletteColor;
    comparador: PaletteColor;
  }

  interface PaletteOptions {
    devoluciones?: PaletteColorOptions;
    pedido?: PaletteColorOptions;
    inventario?: PaletteColorOptions;
    comparador?: PaletteColorOptions;
  }
}
