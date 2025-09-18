from .base_generator import BaseReportGenerator, autosize_columns
from datetime import datetime
from typing import Any, Dict, List, Optional
from collections import defaultdict
import logging

class DevolucionesReportGenerator(BaseReportGenerator):
    def __init__(self, writer: Any, form_data: Dict[str, Any], list_data: List[Dict[str, Any]], data: Optional[Dict[str, Any]] = None, usuario_data: Optional[Dict[str, Any]] = None):
        super().__init__(writer, form_data, list_data, data, usuario_data)
        self.report_type = "REPORTE DE DEVOLUCIONES"
        self.report_key = "devoluciones"

    def _get_normalized_headers(self) -> List[str]:
        """Encabezados normalizados para el reporte de devoluciones"""
        return [
            "CODIGO", "EAN", "EAN14", "Nombre", "Cantidad de unidades devueltas", 
            "Total de cajas devueltas", "Peso total de la devolución", "Línea de producto", "Precio referencial", "Observaciones"
        ]

    def generate(self):
        sheet_name = "DEVOLUCIONES"
        worksheet = self.workbook.create_sheet(title=sheet_name, index=0)
        if len(self.workbook.sheetnames) > 1 and "Sheet" in self.workbook.sheetnames:
            self.workbook.remove(self.workbook["Sheet"])

        # Datos Generales normalizados
        doc_type = self.form_data.get('documentType', '').upper()
        doc_num = self.form_data.get('documento_cliente', '')
        doc_display = f"{doc_type}: {doc_num}" if doc_type and doc_num else doc_num

        general_data = {
            "Cliente": self.cliente,
            "Documento": doc_display,
            "Código de Cliente": self.form_data.get('codigo_cliente', ''),
            "Sucursal": self.form_data.get('sucursal') or 'principal',
            "Fecha": datetime.now(),
            "Responsable": self.usuario,
            "Motivo": self.form_data.get('motivo', '')
        }
        table_start_row = self._create_general_data_block(worksheet, general_data, start_row=1)

        # Encabezados de la tabla normalizados
        headers = self._get_normalized_headers()
        for col_num, header in enumerate(headers, 1):
            worksheet.cell(row=table_start_row, column=col_num, value=header)

        # Cuerpo de la tabla con datos normalizados
        current_row = table_start_row + 1
        
        all_data_rows = [] # To store data rows for styling

        total_unidades_devueltas_sum = 0
        total_cajas_devueltas_sum = 0
        peso_total_devolucion_sum = 0

        for item in self.list_data: # Iterate directly over list_data, no grouping needed for subtotals
            qty = float(item.get("cantidad", 0))
            u_por_caja = float(item.get("cantidad_por_caja", 0))
            peso_unidad = float(item.get("peso", 0))
            precio_referencial = float(item.get("precio_referencial", 0))

            total_cajas_devueltas_item = round(qty / u_por_caja if u_por_caja > 0 else 0, 2)
            peso_total_devolucion_item = round(qty * peso_unidad, 2)

            row_values = [
                self._normalize_value(item.get("codigo")),
                self._normalize_value(item.get("cod_ean")),
                self._normalize_value(item.get("ean_14")),
                self._normalize_value(item.get("nombre")),
                qty,
                total_cajas_devueltas_item,
                peso_total_devolucion_item,
                self._normalize_value(item.get("linea")),
                precio_referencial,
                self._normalize_value(item.get("observaciones"))
            ]
            all_data_rows.append(row_values)
            
            total_unidades_devueltas_sum += qty
            total_cajas_devueltas_sum += total_cajas_devueltas_item
            peso_total_devolucion_sum += peso_total_devolucion_item
        
        # Write all data rows to worksheet
        for row_data in all_data_rows:
            for col_num, value in enumerate(row_data, 1):
                worksheet.cell(row=current_row, column=col_num, value=value)
            current_row += 1
        
        data_rows_end = current_row - 1 # End of actual data rows

        # Aplicar estilos a las filas de datos
        self._apply_table_styles(worksheet, table_start_row, data_rows_end, len(headers))

        # Fila de Totales normalizada
        totals_row = current_row # Totals row comes directly after data rows
        worksheet.cell(row=totals_row, column=1, value="TOTALES GENERALES:")
        worksheet.cell(row=totals_row, column=5, value=total_unidades_devueltas_sum)
        worksheet.cell(row=totals_row, column=6, value=round(total_cajas_devueltas_sum, 2))
        worksheet.cell(row=totals_row, column=7, value=round(peso_total_devolucion_sum, 2))

        # Aplicar estilo a la fila de totales
        self._apply_totals_style(totals_row, 1, 10, worksheet)

        # Ajustar columnas
        autosize_columns(worksheet)

    def get_filename(self) -> str:
        """Genera nombre de archivo para el reporte de devoluciones"""
        client_name = self.cliente.lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        date_str = datetime.now().strftime("%d-%m-%y")
        filename = f"devoluciones_{client_name}_{date_str}.xlsx"
        return filename