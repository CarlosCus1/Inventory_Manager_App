from .base_generator import BaseReportGenerator, STYLE_CONFIG, autosize_columns
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter
from datetime import datetime
import pandas as pd
import unicodedata

class PreciosReportGenerator(BaseReportGenerator):
    def generate(self):
        colaborador = str(self.form_data.get('colaborador', '')).strip()
        marcas_finales: list[str] = []
        for i in range(1, 6):
            marca_ingresada = str(self.form_data.get(f"marca{i}", "")).strip()
            marcas_finales.append(marca_ingresada if marca_ingresada else f"Marca {i}")
        
        fecha_raw = str(self.form_data.get('fecha', '')).strip()
        try:
            dt = datetime.fromisoformat(fecha_raw.replace('Z', '+00:00'))
            fecha_ddmmyy = dt.strftime('%d-%m-%y')
        except (ValueError, TypeError):
            fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

        rows: list[dict] = []
        for it in self.list_data:
            row = {
                "codigo": str(it.get("codigo", "")).strip(),
                "cod_ean": str(it.get("cod_ean", "")).strip(),
                "nombre": str(it.get("nombre", "")).strip()
            }
            precios_map = it.get("precios", {})
            for i, marca_nombre in enumerate(marcas_finales):
                marca_key = str(self.form_data.get(f"marca{i+1}", "")).strip()
                precio_val = precios_map.get(marca_key)
                try:
                    row[marca_nombre] = float(precio_val) if precio_val is not None and precio_val != '' else None
                except (ValueError, TypeError):
                    row[marca_nombre] = None
            rows.append(row)

        df_columns = ["codigo", "cod_ean", "nombre"] + marcas_finales
        df = pd.DataFrame(rows, columns=df_columns)
        sheet_name = "comparacion"
        df.to_excel(self.writer, sheet_name=sheet_name, startrow=11, index=False, header=False)
        ws = self.writer.sheets[sheet_name]

        style_info = STYLE_CONFIG["precios"]
        currency_format = '"S/." #,##0.00'
        percentage_format = '0.00%'

        cell = ws.cell(row=1, column=1, value="comparacion")
        self._apply_header_style(cell, style_info)
        cell = ws.cell(row=2, column=1, value="Colaborador")
        self._apply_header_style(cell, style_info)
        ws.cell(row=2, column=2, value=colaborador)
        for i, m in enumerate(marcas_finales, start=1):
            cell = ws.cell(row=2 + i, column=1, value=f"Marca {i}")
            self._apply_header_style(cell, style_info)
            ws.cell(row=2 + i, column=2, value=m)

        fecha_row = 8
        cell = ws.cell(row=fecha_row, column=1, value="Fecha")
        self._apply_header_style(cell, style_info)
        ws.cell(row=fecha_row, column=2, value=fecha_ddmmyy)
        cell = ws.cell(row=fecha_row + 1, column=1, value="Total Productos:")
        self._apply_header_style(cell, style_info)
        ws.cell(row=fecha_row + 1, column=2, value=len(self.list_data)).number_format = "0"

        columns = ["codigo", "cod_ean", "nombre"] + marcas_finales
        for i in range(1, len(marcas_finales)):
            marca_base = marcas_finales[0]
            marca_competidor = marcas_finales[i]
            columns.append(f"Dif. {marca_competidor} vs {marca_base}")
            columns.append(f"% {marca_competidor} vs {marca_base}")
        columns.extend(["Precio MAX", "Precio MIN", f"% MAX vs {marcas_finales[0]}", f"% MIN vs {marcas_finales[0]}"])

        header_row = 11
        for idx, h in enumerate(columns, start=1):
            cell = ws.cell(row=header_row, column=idx, value=h)
            self._apply_header_style(cell, style_info)
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for r_idx in range(len(df)):
            row_num = 12 + r_idx
            p_base_ref = f"D{row_num}"
            
            p_comp_refs = [f"{get_column_letter(4+i)}{row_num}" for i in range(1, len(marcas_finales))]

            for i in range(len(marcas_finales)):
                ws.cell(row=row_num, column=4 + i).number_format = currency_format

            col_offset = 4 + len(marcas_finales)
            for i in range(len(marcas_finales) - 1):
                comp_ref = p_comp_refs[i]
                dif_col = col_offset + i * 2 + 1
                dif_cell = ws.cell(row=row_num, column=dif_col)
                dif_cell.value = f'=IFERROR({p_base_ref}-{comp_ref}, "")'
                dif_cell.number_format = currency_format
                pct_col = col_offset + i * 2 + 2
                pct_cell = ws.cell(row=row_num, column=pct_col)
                pct_cell.value = f'=IFERROR(({p_base_ref}/{comp_ref})-1, "")'
                pct_cell.number_format = percentage_format

            price_range_cols = get_column_letter(4) + ":" + get_column_letter(3 + len(marcas_finales))
            price_range = f"{price_range_cols}{row_num}"

            summary_price_start_col = col_offset + (len(marcas_finales)-1) * 2 + 1
            max_price_ref = f"{get_column_letter(summary_price_start_col)}{row_num}"
            min_price_ref = f"{get_column_letter(summary_price_start_col + 1)}{row_num}"

            ws[max_price_ref] = f'=IFERROR(MAX({price_range}), "")'
            ws[min_price_ref] = f'=IFERROR(MIN({price_range}), "")'
            for cell_ref in [max_price_ref, min_price_ref]:
                ws[cell_ref].number_format = currency_format

            pct_comp_refs = [f"{get_column_letter(col_offset + i*2 + 2)}{row_num}" for i in range(len(marcas_finales)-1)]
            summary_pct_start_col = summary_price_start_col + 2
            max_pct_ref = f"{get_column_letter(summary_pct_start_col)}{row_num}"
            min_pct_ref = f"{get_column_letter(summary_pct_start_col + 1)}{row_num}"

            ws[max_pct_ref] = f'=IFERROR(MAX({",".join(pct_comp_refs)}), "")'
            ws[min_pct_ref] = f'=IFERROR(MIN({",".join(pct_comp_refs)}), "")'
            for cell_ref in [max_pct_ref, min_pct_ref]:
                ws[cell_ref].number_format = percentage_format

        autosize_columns(ws)

        safe_colab = unicodedata.normalize('NFKD', colaborador).encode('ascii', 'ignore').decode('utf-8').strip().replace(" ", "_") or "sin_colaborador"
        self.filename = f"comparacion_precios_{safe_colab}_{fecha_ddmmyy}.xlsx"
