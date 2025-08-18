from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.styles import PatternFill, Font, Alignment
from typing import Any, Dict, List, Optional

# Un diccionario para centralizar los colores y estilos de los encabezados.
STYLE_CONFIG = {
        "devoluciones": {"header_color": "FFC7CE", "font_color": "9C0006"}, # Rojo
        "pedido": {"header_color": "B4C6E7", "font_color": "1F3864"}, # Azul
        "inventario": {"header_color": "C6E0B4", "font_color": "385723"}, # Verde
        "precios": {"header_color": "FFD966", "font_color": "8D5F00"}, # Naranja
        "default": {"header_color": "D9D9D9", "font_color": "000000"},  # Gris
        "planner_charts": {
            "rojo": "FF0000",   # Viniball
            "azul": "0070C0",   # Vinifan
            "verde": "00B050",  # Otros
            "default": "4472C4" # Un azul por defecto si no se especifica
        }
    }

def autosize_columns(worksheet: Worksheet):
    """
    Ajusta el ancho de todas las columnas de la hoja de cálculo al
    contenido más largo.
    """
    for col in worksheet.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                # Se manejan casos de valores None o no strings
                if cell.value is not None:
                    value_len = len(str(cell.value))
                    if value_len > max_length:
                        max_length = value_len
            except (TypeError, ValueError):
                pass
        adjusted_width = (max_length + 2)
        worksheet.column_dimensions[column].width = adjusted_width

class BaseReportGenerator:
    def __init__(self, writer: Any, form_data: Dict[str, Any], list_data: List[Dict[str, Any]], data: Optional[Dict[str, Any]] = None):
        self.writer = writer
        self.form_data = form_data
        self.list_data = list_data
        self.data = data # Para el caso del planificador que usa 'data' directamente
        self.workbook = writer.book

    def generate(self):
        # Este método será implementado por cada clase hija
        raise NotImplementedError("Cada generador debe implementar su propio método 'generate'.")

    def _apply_header_style(self, cell, style_info):
        header_fill = PatternFill(start_color=style_info['header_color'], fill_type="solid")
        header_font = Font(bold=True, color=style_info['font_color'])
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
