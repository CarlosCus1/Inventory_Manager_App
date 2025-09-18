from .base_generator import BaseReportGenerator, autosize_columns
from datetime import datetime
from typing import Any, Dict, List, Optional
from collections import defaultdict
from ..constants import FormKeys, ProductKeys

class InventarioReportGenerator(BaseReportGenerator):
    def __init__(self, writer: Any, form_data: Dict[str, Any], list_data: List[Dict[str, Any]], data: Optional[Dict[str, Any]] = None, usuario_data: Optional[Dict[str, Any]] = None):
        super().__init__(writer, form_data, list_data, data, usuario_data)
        self.report_type = "REPORTE DE INVENTARIO FÍSICO"
        self.report_key = "inventario"

    def get_filename(self) -> str:
        """Genera nombre de archivo para el reporte de inventario"""
        client_name = self.cliente.lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        date_str = datetime.now().strftime("%d-%m-%y")
        filename = f"inventario_{client_name}_{date_str}.xlsx"
        return filename

    def _get_normalized_headers(self) -> List[str]:
        """Encabezados normalizados para el reporte de inventario"""
        return [
            "Código", "EAN", "EAN14", "Nombre", "Existencia en almacén", 
            "Total de cajas en stock", "Línea de producto", "Peso total en stock", 
            "Precio referencial", "Valor total del inventario", "Observaciones"
        ]

    def generate(self):
        sheet_name = "INVENTARIO"
        worksheet = self.workbook.create_sheet(title=sheet_name, index=0)
        if len(self.workbook.sheetnames) > 1 and "Sheet" in self.workbook.sheetnames:
            self.workbook.remove(self.workbook["Sheet"])

        # Datos Generales normalizados
        doc_type = self.form_data.get(FormKeys.DOCUMENT_TYPE, '').upper()
        doc_num = self.form_data.get(FormKeys.DOCUMENTO_CLIENTE, '')
        doc_display = f"{doc_type}: {doc_num}" if doc_type and doc_num else doc_num

        general_data = {
            "Cliente": self.cliente,
            "Documento": doc_display,
            "Código de Cliente": self.form_data.get(FormKeys.CODIGO_CLIENTE, ''),
            "Sucursal": self.form_data.get(FormKeys.SUCURSAL) or 'principal',
            "Responsable": self.usuario,
            "Fecha": datetime.now(),
            "Total Productos": len(self.list_data),
            "Total Líneas Únicas": self.data.get('totalLineas', 0)
        }
        table_start_row = self._create_general_data_block(worksheet, general_data, start_row=1)

        # Encabezados de la tabla normalizados
        headers = self._get_normalized_headers()
        for col_num, header in enumerate(headers, 1):
            worksheet.cell(row=table_start_row, column=col_num, value=header)

        all_data_rows = []
        
        total_existencia_sum = 0
        total_cajas_stock_sum = 0
        total_peso_stock_sum = 0
        total_valor_inventario_sum = 0

        # Procesar cada producto individualmente
        for item in self.list_data:
            cantidad_ingresada = float(item.get(ProductKeys.CANTIDAD, 0))
            u_por_caja = float(item.get(ProductKeys.CANTIDAD_POR_CAJA, 0))
            peso_unidad = float(item.get(ProductKeys.PESO, 0))
            precio_referencial = float(item.get(ProductKeys.PRECIO_REFERENCIA, 0))

            total_cajas_en_stock_item = round(cantidad_ingresada / u_por_caja if u_por_caja > 0 else 0, 2)
            peso_total_en_stock_item = round(cantidad_ingresada * peso_unidad, 2)
            valor_total_inventario_item = round(cantidad_ingresada * precio_referencial, 2)

            row_values = [
                self._normalize_value(item.get(ProductKeys.CODIGO)),
                self._normalize_value(item.get(ProductKeys.COD_EAN)),
                self._normalize_value(item.get(ProductKeys.EAN_14)),
                self._normalize_value(item.get(ProductKeys.NOMBRE)),
                cantidad_ingresada,
                total_cajas_en_stock_item,
                self._normalize_value(item.get(ProductKeys.LINEA)),
                peso_total_en_stock_item,
                precio_referencial,
                valor_total_inventario_item,
                self._normalize_value(item.get(ProductKeys.OBSERVACIONES))
            ]
            all_data_rows.append(row_values)
            
            # Acumular totales directamente
            total_existencia_sum += cantidad_ingresada
            total_cajas_stock_sum += total_cajas_en_stock_item
            total_peso_stock_sum += peso_total_en_stock_item
            total_valor_inventario_sum += valor_total_inventario_item
        
        # Initialize current_row after headers
        current_row = table_start_row + 1
        
        # Write all data rows to worksheet
        for row_data in all_data_rows:
            for col_num, value in enumerate(row_data, 1):
                worksheet.cell(row=current_row, column=col_num, value=value)
            current_row += 1
        
        data_rows_end = current_row - 1 # End of actual data rows

        # Aplicar estilos a las filas de datos
        self._apply_table_styles(worksheet, table_start_row, data_rows_end, len(headers))

        # Fila de Totales normalizada
        totals_row = current_row
        worksheet.cell(row=totals_row, column=1, value="TOTALES GENERALES:")
        worksheet.cell(row=totals_row, column=5, value=total_existencia_sum)
        worksheet.cell(row=totals_row, column=6, value=round(total_cajas_stock_sum, 2))
        worksheet.cell(row=totals_row, column=8, value=round(total_peso_stock_sum, 2))
        worksheet.cell(row=totals_row, column=10, value=round(total_valor_inventario_sum, 2))

        # Aplicar estilo a la fila de totales
        self._apply_totals_style(totals_row, 1, 11, worksheet)

        # Ajustar columnas
        autosize_columns(worksheet)