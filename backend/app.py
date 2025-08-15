
# --------------------------------------------------------------------------- #
#                                                                             #
#                            backend/app.py                                   #
#                                                                             #
# --------------------------------------------------------------------------- #

# --- 1. Importaciones necesarias ---
# Flask para crear el servidor y manejar las peticiones.
from flask import Flask, request, jsonify, send_file, make_response
# Flask-CORS para permitir peticiones desde el frontend (que corre en otro puerto).
from flask_cors import CORS
# Pandas para crear y manipular los datos en un formato tabular (DataFrame).
import pandas as pd
# Openpyxl para aplicar estilos personalizados al archivo Excel.
from openpyxl.styles import PatternFill, Font, Alignment
# Datetime para obtener la fecha actual y formatear el nombre del archivo.
from datetime import datetime
# io para manejar el archivo Excel en memoria sin necesidad de guardarlo en disco.
import io
import unicodedata
from typing import Any, Dict, List

# --- 2. Inicialización de la aplicación Flask ---
app = Flask(__name__)
# Se habilita CORS para todas las rutas y orígenes, y se expone el encabezado
# 'Content-Disposition' para que el frontend pueda leer el nombre del archivo.
CORS(app, expose_headers=["Content-Disposition"])

# --- 3. Configuración de Estilos ---
# Un diccionario para centralizar los colores de los encabezados según el tipo de reporte.
# Esto facilita mantener una identidad visual consistente y es fácil de expandir.
# Los colores están en formato ARGB (sin el Alpha inicial, RGB en hexadecimal).
STYLE_CONFIG = {

        "devoluciones": {"header_color": "FFC7CE", "font_color": "9C0006"}, # Rojo
        "pedido": {"header_color": "B4C6E7", "font_color": "1F3864"}, # Azul
        "inventario": {"header_color": "C6E0B4", "font_color": "385723"}, # Verde
        "precios": {"header_color": "FFD966", "font_color": "8D5F00"}, # Naranja
        "default": {"header_color": "D9D9D9", "font_color": "000000"}  # Gris
    }

# Datos de ejemplo para el endpoint de días festivos.
HOLIDAYS_2025 = [
    {"date": "01/01/2025", "name": "Año Nuevo"},
    {"date": "17/04/2025", "name": "Jueves Santo"},
    {"date": "18/04/2025", "name": "Viernes Santo"},
    {"date": "01/05/2025", "name": "Día del Trabajo"},
    {"date": "07/06/2025", "name": "Batalla de Arica y Día de la Bandera"},
    {"date": "29/06/2025", "name": "San Pedro y San Pablo"},
    {"date": "23/07/2025", "name": "Día de la Fuerza Aérea del Perú"},
    {"date": "28/07/2025", "name": "Fiestas Patrias"},
    {"date": "29/07/2025", "name": "Fiestas Patrias"},
    {"date": "06/08/2025", "name": "Batalla de Junín"},
    {"date": "30/08/2025", "name": "Santa Rosa de Lima"},
    {"date": "08/10/2025", "name": "Combate de Angamos"},
    {"date": "01/11/2025", "name": "Día de Todos los Santos"},
    {"date": "08/12/2025", "name": "Inmaculada Concepción"},
    {"date": "09/12/2025", "name": "Batalla de Ayacucho"},
]

# --- 4. Funciones Auxiliares ---
def autosize_columns(worksheet: Workbook.active):
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

def _generate_standard_report(writer: pd.ExcelWriter, tipo_gestion: str, form_data: Dict[str, Any], list_data: List[Dict[str, Any]]):
    """
    Genera una hoja de cálculo estándar para 'pedido' o 'inventario',
    unificando la lógica duplicada.
    """
    # --- 1. Configuración específica por tipo de reporte ---
    configs = {
        'pedido': {
            'sheet_name': "pedido",
            'df_cols': ["codigo", "cod_ean", "nombre", "cantidad", "peso", "observaciones"],
            'info_fields': [
                ("hoja de pedido", ""),
                ("Cliente", form_data.get('cliente', '')),
                ("RUC o DNI", form_data.get('documento_cliente', '')),
                ("Código Cliente", form_data.get('codigo_cliente', '')),
                ("Fecha", form_data.get('fecha', ''))
            ],
            'header_start_row': 7,
            'number_formats': {'D': '0', 'E': '#,##0.00'}
        },
        'inventario': {
            'sheet_name': "inventario",
            'df_cols': ["codigo", "cod_ean", "nombre", "cantidad", "linea", "observaciones"],
            'info_fields': [
                ("inventario", ""),
                ("Cliente", form_data.get('cliente', '')),
                ("RUC o DNI", form_data.get('documento_cliente', '')),
                ("Colaborador", form_data.get('colaborador_personal', '')),
                ("Fecha", form_data.get('fecha', ''))
            ],
            'header_start_row': 8,
            'number_formats': {'D': '0'}
        }
    }

    # Se maneja el caso de un tipo de gestión desconocido, aunque ya está filtrado
    config = configs.get(tipo_gestion)
    if not config:
        raise ValueError(f"Tipo de gestión desconocido: {tipo_gestion}")

    sheet_name = config['sheet_name']
    
    # --- 2. Normalización de datos y creación de DataFrame ---
    fecha_raw = str(form_data.get('fecha', '')).strip()
    try:
        # Se manejan cadenas ISO con 'Z' o sin ella.
        dt = datetime.fromisoformat(fecha_raw.replace('Z', '+00:00'))
        fecha_ddmmyy = dt.strftime('%d-%m-%y')
    except (ValueError, TypeError):
        fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

    # Actualizar la fecha en los campos de información
    for i, (label, _) in enumerate(config['info_fields']):
        if label == "Fecha":
            config['info_fields'][i] = ("Fecha", fecha_ddmmyy)

    df = pd.DataFrame(list_data)
    for col in config['df_cols']:
        if col not in df.columns:
            df[col] = "" if col in ("cod_ean", "observaciones", "nombre", "linea") else 0
    df = df[config['df_cols']]

    # --- 3. Escritura en Excel ---
    data_start_row = config['header_start_row']
    # Se añade un encabezado para evitar que pandas lo escriba.
    df.to_excel(writer, sheet_name=sheet_name, startrow=data_start_row, index=False, header=False)
    ws = writer.sheets[sheet_name]

    # --- 4. Estilos y Formato ---
    style_info = STYLE_CONFIG.get(tipo_gestion, STYLE_CONFIG['default'])
    header_fill = PatternFill(start_color=style_info['header_color'], fill_type="solid")
    header_font = Font(bold=True, color=style_info['font_color'])

    # --- 5. Escritura de Información General y Encabezados ---
    current_row = 1
    for label, value in config['info_fields']:
        ws.cell(row=current_row, column=1, value=label).font = header_font
        ws.cell(row=current_row, column=1).fill = header_fill
        if value:
            ws.cell(row=current_row, column=2, value=value)
        current_row += 1

    # Encabezados de la tabla
    for idx, h in enumerate(config['df_cols'], start=1):
        cell = ws.cell(row=data_start_row, column=idx, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Formatos de número para las columnas de datos
    data_first_row_idx = data_start_row + 1
    for r_idx in range(data_first_row_idx, data_first_row_idx + len(df)):
        for col_letter, fmt in config['number_formats'].items():
            ws[f'{col_letter}{r_idx}'].number_format = fmt

    # --- 6. Escritura de Totales ---
    total_row_idx = data_start_row + len(df) + 2
    ws.cell(row=total_row_idx, column=1, value="totales").font = header_font
    ws.cell(row=total_row_idx, column=1).fill = header_fill

    if tipo_gestion == 'pedido':
        if len(df) > 0:
            start_row_data_formula = data_start_row + 1
            end_row_data_formula = data_start_row + len(df)
            
            # Suma de la columna de cantidad (D)
            total_cantidad_cell = ws.cell(row=total_row_idx, column=4)
            total_cantidad_cell.value = f"=SUM(D{start_row_data_formula}:D{end_row_data_formula})"
            total_cantidad_cell.number_format = "0"
            
            # Suma de la columna de peso (E), multiplicando por la cantidad (D)
            total_peso_cell = ws.cell(row=total_row_idx, column=5)
            total_peso_cell.value = f"=SUMPRODUCT(D{start_row_data_formula}:D{end_row_data_formula},E{start_row_data_formula}:E{end_row_data_formula})"
            total_peso_cell.number_format = "#,##0.00"
        else:
            ws.cell(row=total_row_idx, column=4, value=0).number_format = "0"
            ws.cell(row=total_row_idx, column=5, value=0).number_format = "#,##0.00"

    elif tipo_gestion == 'inventario':
        if len(df) > 0:
            start_row_data_formula = data_start_row + 1
            end_row_data_formula = data_start_row + len(df)
            
            # Suma de la columna de cantidad (D)
            total_cantidad_cell = ws.cell(row=total_row_idx, column=4)
            total_cantidad_cell.value = f"=SUM(D{start_row_data_formula}:D{end_row_data_formula})"
            total_cantidad_cell.number_format = "0"
            
            # Conteo de líneas únicas
            unique_lines = df['linea'].dropna().apply(lambda x: str(x).strip().upper()).nunique()
            ws.cell(row=total_row_idx, column=5, value="Total Líneas Únicas:").font = header_font
            ws.cell(row=total_row_idx, column=5).fill = header_fill
            ws.cell(row=total_row_idx, column=6, value=unique_lines).number_format = "0"
        else:
            ws.cell(row=total_row_idx, column=4, value=0).number_format = "0"
            ws.cell(row=total_row_idx, column=5, value="Total Líneas Únicas:").font = header_font
            ws.cell(row=total_row_idx, column=5).fill = header_fill
            ws.cell(row=total_row_idx, column=6, value=0).number_format = "0"
    
    # Autoajuste final
    autosize_columns(ws)

# --- 4.5. Lógica para Reporte del Planificador ---
def _generate_planner_report(writer: pd.ExcelWriter, data: Dict[str, Any], chart_color_name: Optional[str] = None):
    """
    Genera un reporte detallado para el módulo planificador, utilizando pandas
    para la creación de hojas y openpyxl para el estilo y el gráfico.
    """
    from openpyxl.chart import BarChart, Reference
    from openpyxl.chart.label import DataLabelList
    from openpyxl.chart.shapes import GraphicalProperties

    # --- Funciones de Ayuda y Mapeo de Colores ---
    COLOR_MAP = {
        "rojo": "FF0000",   # Viniball
        "azul": "0070C0",   # Vinifan
        "verde": "00B050",  # Otros
        "default": "4472C4" # Un azul por defecto si no se especifica
    }
    hex_color = COLOR_MAP.get(chart_color_name or "default", COLOR_MAP["default"])

    def _lighten_color(hex_color, factor=0.5):
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        new_rgb = [int(val + (255 - val) * factor) for val in rgb]
        return f'{new_rgb[0]:02X}{new_rgb[1]:02X}{new_rgb[2]:02X}'

    def format_month_year_es(date_obj: datetime) -> str:
        MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        return f"{MONTH_NAMES_ES[date_obj.month - 1]} {date_obj.year}"

    # --- DataFrames ---
    # Hoja de Dashboard
    info_data = [
        ("Cód. Cliente:", data.get('codigoCliente', '')),
        ("RUC:", data.get('ruc', '')),
        ("Cliente:", data.get('razonSocial', '')),
        ("Línea:", data.get('linea', '')),
        ("Cód. Pedido:", data.get('pedido', '')),
        ("Monto Total:", data.get('montoOriginal', 0)),
        ("Total Letras:", len(data.get('fechasOrdenadas', [])))
    ]
    df_info = pd.DataFrame(info_data, columns=["Campo", "Valor"])

    resumen_mensual = data.get('resumenMensual', {})
    df_resumen = pd.DataFrame(list(resumen_mensual.items()), columns=["Mes", "Monto (S/)"])
    df_resumen["Porcentaje"] = df_resumen["Monto (S/)"] / data.get('montoOriginal', 1)

    # Hoja de Detalle de Pagos
    fechas_ordenadas = data.get('fechasOrdenadas', [])
    montos_asignados = data.get('montosAsignados', {})
    detalle_data = [{"N°": i + 1, "Fecha de Vencimiento": fecha, "Monto (S/)": montos_asignados.get(fecha, 0)} for i, fecha in enumerate(fechas_ordenadas)]
    df_detalle = pd.DataFrame(detalle_data)

    # --- Escritura en Excel ---
    df_info.to_excel(writer, sheet_name="Reporte Dashboard", startrow=2, index=False, header=False)
    df_resumen.to_excel(writer, sheet_name="Reporte Dashboard", startrow=len(df_info) + 4, index=False)
    df_detalle.to_excel(writer, sheet_name="Detalle de Pagos", index=False)

    # --- Estilizado ---
    ws_dashboard = writer.sheets["Reporte Dashboard"]
    ws_detalle = writer.sheets["Detalle de Pagos"]

    color_hex = STYLE_CONFIG['pedido']['header_color']
    styles = {
        'main_title_font': Font(bold=True, size=16, color="FFFFFF"),
        'section_title_font': Font(bold=True, size=12, color="FFFFFF"),
        'main_color_fill': PatternFill(start_color=color_hex, fill_type="solid"),
    }

    # Estilo Dashboard
    ws_dashboard.merge_cells('A1:C1')
    cell = ws_dashboard['A1']
    cell.value = "DISTRIBUCION DE MONTOS POR FECHA"
    cell.font = styles['main_title_font']
    cell.fill = styles['main_color_fill']
    cell.alignment = Alignment(horizontal='center', vertical='center')

    # Estilo Detalle
    for col in ws_detalle.columns:
        ws_detalle.column_dimensions[col[0].column_letter].width = 20

    # --- Creación y Estilo del Gráfico ---
    chart = BarChart()
    chart.title = "Resumen de Montos por Mes"
    chart.style = 12
    chart.y_axis.title = 'Monto (S/)'
    chart.x_axis.title = 'Mes'
    chart.legend = None # Sin leyenda para un look más limpio

    # Rango de datos (columna B de la tabla de resumen)
    data_ref = Reference(ws_dashboard, min_col=2, min_row=len(df_info) + 5, max_row=len(df_info) + 5 + len(df_resumen))
    # Rango de categorías (columna A)
    cats_ref = Reference(ws_dashboard, min_col=1, min_row=len(df_info) + 6, max_row=len(df_info) + 5 + len(df_resumen))

    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)

    # Personalización del color de las barras
    series = chart.series[0]
    fill = PatternFill(patternType='solid', fgColor=hex_color)
    series.graphicalProperties = GraphicalProperties(solidFill=fill)

    # Añadir el gráfico a la hoja
    ws_dashboard.add_chart(chart, "E3")


# --- 5. Definición de Endpoints ---

@app.route('/api/getHolidays', methods=['GET'])
def get_holidays():
    """
    Endpoint para obtener los días festivos del 2025.
    """
    year = request.args.get('year', type=int)
    if year == 2025:
        return jsonify(HOLIDAYS_2025)
    else:
        return jsonify([]), 404

=======
    "devoluciones": {"header_color": "FFC7CE", "font_color": "9C0006"}, # Rojo
    # Pedido = AZUL
    "pedido":       {"header_color": "B4C6E7", "font_color": "1F3864"}, # Azul
    # Inventario = VERDE
    "inventario":   {"header_color": "C6E0B4", "font_color": "385723"}, # Verde
    # Comparación = NARANJA
    "comparador":   {"header_color": "FFD966", "font_color": "8D5F00"}, # Naranja
    "default":      {"header_color": "D9D9D9", "font_color": "000000"}  # Gris
}

# --- 4. Definición del Endpoint de Exportación ---

@app.route('/export-xlsx', methods=['POST'])
def export_xlsx():
    """
    Endpoint que recibe datos en formato JSON, genera un archivo Excel
    y lo devuelve como una descarga para el usuario.
    """
    try:
        # --- A. Recepción y Validación de Datos ---
        data = request.get_json()
        if not data or 'tipo' not in data or 'form' not in data or 'list' not in data:
            return jsonify({"error": "Faltan datos en la petición (se requiere 'tipo', 'form' y 'list')"}), 400

        tipo_gestion = data.get('tipo', 'desconocido')
        form_data = data.get('form', {})
        list_data = data.get('list', [])

        # Ramificación por tipo de gestión
        if tipo_gestion == 'precios':
            # --- INICIO: LÓGICA MEJORADA PARA COMPARACIÓN DE PRECIOS ---

            # 1. Normalización de Datos Generales y Estructura Fija de 5 Marcas
            colaborador = str(form_data.get('colaborador', '')).strip()
            
            # Forzar siempre una lista de 5 marcas para una estructura de columnas fija.
            marcas_finales: List[str] = []
            for i in range(1, 6): # De marca1 a marca5
                marca_ingresada = str(form_data.get(f"marca{i}", "")).strip()
                # Si no se ingresa una marca, se usa un placeholder.
                marcas_finales.append(marca_ingresada if marca_ingresada else f"Marca {i}")

            fecha_raw = str(form_data.get('fecha', '')).strip()
            try:
                dt = datetime.fromisoformat(fecha_raw[:10])
                fecha_ddmmyy = dt.strftime('%d-%m-%y')
            except Exception:
                fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

            # 2. Preparación de Filas para el DataFrame (solo datos base)
            # Los cálculos se harán con fórmulas de Excel, no en Python.
            rows: list[dict] = []
            for it in list_data:
                row = {
                    "codigo": str(it.get("codigo", "")).strip(),
                    "cod_ean": str(it.get("cod_ean", "")).strip(),
                    "nombre": str(it.get("nombre", "")).strip()
                }
                precios_map = it.get("precios", {})
                
                # Añadir los 5 precios. Si no vienen, se dejan como None.
                for i, marca_nombre in enumerate(marcas_finales):
                    # El frontend envía los precios usando el nombre de la marca como clave.
                    # Buscamos el precio usando la marca original ingresada en el form.
                    marca_original = str(form_data.get(f"marca{i+1}", "")).strip()
                    precio_val = precios_map.get(marca_original) if marca_original else None
                    
                    try:
                        row[marca_nombre] = float(precio_val) if precio_val is not None else None
                    except (ValueError, TypeError):
                        row[marca_nombre] = None
                rows.append(row)

            # 3. Definición de Columnas del DataFrame y del Excel
            # El DataFrame solo necesita las columnas de datos base.
            df_columns = ["codigo", "cod_ean", "nombre"] + marcas_finales
            df = pd.DataFrame(rows, columns=df_columns)

            # Las columnas del Excel incluyen las calculadas.
            marca_base = marcas_finales[0]
            columns = ["codigo", "cod_ean", "nombre"]
            columns.extend(marcas_finales)
            for i in range(1, 5):
                marca_competidor = marcas_finales[i]
                columns.append(f"Dif. {marca_competidor} vs {marca_base}")
                columns.append(f"% {marca_competidor} vs {marca_base}")
            columns.extend(["Precio MAX", "Precio MIN"])
            columns.extend([f"% MAX vs {marca_base}", f"% MIN vs {marca_base}"])

            # 4. Creación y Formateo del Archivo XLSX
            output_buffer = io.BytesIO()
            with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
                from openpyxl.utils import get_column_letter

                sheet_name = "comparacion"
                # Escribimos los datos base (código, nombre y 5 precios)
                df.to_excel(writer, sheet_name=sheet_name, startrow=11, index=False, header=False)

                ws = writer.sheets[sheet_name] # Obtenemos la hoja de trabajo directamente

                # Estilos
                style_info = STYLE_CONFIG["comparador"]
                header_fill = PatternFill(start_color=style_info['header_color'], end_color=style_info['header_color'], fill_type="solid")
                header_font = Font(bold=True, color=style_info['font_color'])
                currency_format = '"S/." #,##0.00'
                percentage_format = '0.00%'

                # Título y Datos Generales
                ws.cell(row=1, column=1, value="comparacion").font = header_font
                ws.cell(row=1, column=1).fill = header_fill
                ws.cell(row=2, column=1, value="Colaborador").font = header_font
                ws.cell(row=2, column=1).fill = header_fill
                ws.cell(row=2, column=2, value=colaborador)
                for i, m in enumerate(marcas_finales, start=1):
                    ws.cell(row=2 + i, column=1, value=f"Marca {i}").font = header_font
                    ws.cell(row=2 + i, column=1).fill = header_fill
                    ws.cell(row=2 + i, column=2, value=m)
                fecha_row = 8
                ws.cell(row=fecha_row, column=1, value="Fecha").font = header_font
                ws.cell(row=fecha_row, column=1).fill = header_fill
                ws.cell(row=fecha_row, column=2, value=fecha_ddmmyy)

                # Total de productos
                ws.cell(row=fecha_row + 1, column=1, value="Total Productos:").font = header_font
                ws.cell(row=fecha_row + 1, column=1).fill = header_fill
                ws.cell(row=fecha_row + 1, column=2, value=len(list_data)).number_format = "0"

                # Escritura de Encabezados de la tabla
                header_row = 11
                for idx, h in enumerate(columns, start=1):
                    cell = ws.cell(row=header_row, column=idx)
                    cell.value = h
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                # 5. Escritura de Fórmulas y Formatos en las Filas de Datos
                for r_idx in range(len(df)):
                    row_num = 12 + r_idx
                    
                    # Letras de las columnas de precios (D, E, F, G, H)
                    p_base_ref = f"D{row_num}"
                    p_comp_refs = [f"{get_column_letter(5+i)}{row_num}" for i in range(4)] # E, F, G, H
                    
                    # Aplicar formato de moneda a los precios base
                    for i in range(5):
                        ws.cell(row=row_num, column=4 + i).number_format = currency_format

                    # Fórmulas de Diferencia y Porcentaje para cada competidor
                    col_offset = 9 # La primera columna de cálculo es la I (9)
                    for i in range(4):
                        comp_ref = p_comp_refs[i]
                        # Columna de Diferencia
                        dif_cell = ws.cell(row=row_num, column=col_offset + i*2)
                        dif_cell.value = f'=IFERROR({p_base_ref}-{comp_ref}, "")'
                        dif_cell.number_format = currency_format
                        # Columna de Porcentaje
                        pct_cell = ws.cell(row=row_num, column=col_offset + i*2 + 1)
                        pct_cell.value = f'=IFERROR(({p_base_ref}/{comp_ref})-1, "")'
                        pct_cell.number_format = percentage_format

                    # Fórmulas de Resumen de Precios
                    summary_price_start_col = 17 # Columna Q
                    price_range = f"D{row_num}:H{row_num}"
                    max_price_ref = f"{get_column_letter(summary_price_start_col)}{row_num}"
                    min_price_ref = f"{get_column_letter(summary_price_start_col+1)}{row_num}"

                    ws[max_price_ref] = f'=IFERROR(MAX({price_range}), "")'
                    ws[min_price_ref] = f'=IFERROR(MIN({price_range}), "")'
                    for cell_ref in [max_price_ref, min_price_ref]:
                        ws[cell_ref].number_format = currency_format

                    # Fórmulas de Resumen de Porcentajes vs Marca Base
                    summary_pct_start_col = 19 # Columna S
                    max_pct_ref = f"{get_column_letter(summary_pct_start_col)}{row_num}"
                    min_pct_ref = f"{get_column_letter(summary_pct_start_col+1)}{row_num}"

                    # Celdas de porcentaje de competidores (J, L, N, P)
                    pct_comp_refs = [f"{get_column_letter(9 + i*2 + 1)}{row_num}" for i in range(4)]

                    ws[max_pct_ref] = f'=IFERROR(MAX({",".join(pct_comp_refs)}), "")'
                    ws[min_pct_ref] = f'=IFERROR(MIN({",".join(pct_comp_refs)}), "")'
                    for cell_ref in [max_pct_ref, min_pct_ref]:
                        ws[cell_ref].number_format = percentage_format

                autosize_columns(ws)


            # --- Caso 2: Inventario, Pedido o Planificador (lógica unificada) ---
            elif tipo_gestion in ['inventario', 'pedido', 'planificador']:
                if tipo_gestion == 'planificador':
                    chart_color = form_data.get('linea_planificador_color')
                    _generate_planner_report(writer, data, chart_color_name=chart_color)
                else:
                    _generate_standard_report(writer, tipo_gestion, form_data, list_data)

                ws = writer.sheets[tipo_gestion] if tipo_gestion != 'planificador' else writer.book["Reporte Dashboard"]
                
                # Generación del nombre de archivo después de procesar
                if tipo_gestion == 'planificador':
                    cliente = str(data.get('razonSocial', '')).strip()
                    fecha_raw = str(data.get('fechasOrdenadas', [''])[0]).strip()
                else:
                    cliente = str(form_data.get('cliente', '')).strip()
                    fecha_raw = str(form_data.get('fecha', '')).strip()
                try:
                    dt = datetime.fromisoformat(fecha_raw.replace('Z', '+00:00'))
                    fecha_ddmmyy = dt.strftime('%d-%m-%y')
                except (ValueError, TypeError):
                  
            # Nombre de archivo
            safe_colab = colaborador.strip().replace(" ", "_") or "sin_colaborador"
            filename = f"comparacion_precios_{safe_colab}_{fecha_ddmmyy}.xlsx"

            output_buffer.seek(0)
            resp = make_response(send_file(
                output_buffer,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                as_attachment=True,
                download_name=filename
            ))
            return resp

        if tipo_gestion == 'inventario':
            # --- Inventario (paleta VERDE) ---
            # 1) Normalización de generales
            cliente = str(form_data.get('cliente', '')).strip()
            ruc = str(form_data.get('documento_cliente', '')).strip()
            colaborador = str(form_data.get('colaborador', '')).strip()
            fecha_raw = str(form_data.get('fecha', '')).strip()

            # Formateo fecha dd-mm-yy si llega en ISO
            try:
                dt = datetime.fromisoformat(fecha_raw[:10])
                fecha_ddmmyy = dt.strftime('%d-%m-%y')
            except Exception:
                if len(fecha_raw) == 8 and fecha_raw[2] == '-' and fecha_raw[5] == '-':
                    fecha_ddmmyy = fecha_raw
                else:
                  
                    fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

            # 2) DataFrame con columnas exactas y orden
            df = pd.DataFrame(list_data)
            # Asegurar columnas requeridas
            for col in ["codigo", "cod_ean", "nombre", "cantidad", "linea", "observaciones"]:
                if col not in df.columns:
                    df[col] = "" if col in ("cod_ean", "observaciones", "nombre", "linea") else 0
            df = df[["codigo", "cod_ean", "nombre", "cantidad", "linea", "observaciones"]]

            # 3) Crear XLSX en memoria
            output_buffer = io.BytesIO()
            with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
                sheet_name = "inventario"
                # Write data starting from Excel row 9 (startrow=8)
                df.to_excel(writer, sheet_name=sheet_name, startrow=8, index=False, header=False)

                ws = writer.sheets[sheet_name]

                style_info = STYLE_CONFIG["inventario"]
                header_fill = PatternFill(start_color=style_info['header_color'], end_color=style_info['header_color'], fill_type="solid")
                header_font = Font(bold=True, color=style_info['font_color'])

                # Título y Datos Generales (verde)
                ws.cell(row=1, column=1, value="inventario").font = header_font
                ws.cell(row=1, column=1).fill = header_fill

                ws.cell(row=2, column=1, value="Cliente").font = header_font
                ws.cell(row=2, column=1).fill = header_fill
                ws.cell(row=2, column=2, value=cliente)

                ws.cell(row=3, column=1, value="RUC o DNI").font = header_font
                ws.cell(row=3, column=1).fill = header_fill
                ws.cell(row=3, column=2, value=ruc)

                ws.cell(row=4, column=1, value="Fecha").font = header_font
                ws.cell(row=4, column=1).fill = header_fill
                ws.cell(row=4, column=2, value=fecha_ddmmyy)

                ws.cell(row=5, column=1, value="Colaborador").font = header_font
                ws.cell(row=5, column=1).fill = header_fill
                ws.cell(row=5, column=2, value=colaborador)

                # Fila 6: Totales (cantidad y líneas únicas)
                total_row_fixed = 6
                ws.cell(row=total_row_fixed, column=1, value="totales").font = header_font
                ws.cell(row=total_row_fixed, column=1).fill = header_fill

                # Suma de cantidad con fórmula de Excel para que sea dinámico
                total_cantidad_cell = ws.cell(row=total_row_fixed, column=4)
                start_row_data_formula = 9 # Data starts at Excel row 9
                end_row_data_formula = 8 + len(df) # Last row of data
                if len(df) > 0:
                    total_cantidad_cell.value = f"=SUM(D{start_row_data_formula}:D{end_row_data_formula})"
                else:
                    total_cantidad_cell.value = 0
                total_cantidad_cell.number_format = "0"

                # Contador de líneas únicas
                unique_lines = df['linea'].dropna().apply(lambda x: str(x).strip().upper()).nunique()
                ws.cell(row=total_row_fixed, column=5, value="Total Líneas Únicas:").font = header_font
                ws.cell(row=total_row_fixed, column=5).fill = header_fill
                ws.cell(row=total_row_fixed, column=6, value=unique_lines).number_format = "0"

                # Fila 7 vacía (separador) - No se necesita escribir nada explícitamente si la siguiente empieza en 8

                # Encabezados en fila 8 (verde)
                headers = ["codigo", "cod_ean", "nombre", "cantidad", "linea", "observaciones"]
                header_row = 8
                for idx, h in enumerate(headers, start=1):
                    ws.cell(row=header_row, column=idx, value=h)
                    cell = ws.cell(row=header_row, column=idx)
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                # Formatos a partir de fila 9 (datos)
                # cantidad (col 4) es entero; las demás son texto en este módulo
                for r in range(9, 9 + len(df)):
                    ws.cell(row=r, column=4).number_format = "0"  # cantidad

                # Limpieza previa del bloque de tabla (A9:F...)
                # Adjust the cleaning range to start from row 9
                max_row_clear = 9 + max(len(df) + 5, 20)
                for r in range(9, max_row_clear + 1):
                    for c in range(1, 7):
                        ws.cell(row=r, column=c, value=None)

                # Autosize columnas
                autosize_columns(ws)

                # Autosize columnas
                autosize_columns(ws)

            # Nombre de archivo
            safe_cliente = cliente.strip().replace(" ", "_")
            filename = f"inventario_{safe_cliente}_{fecha_ddmmyy}.xlsx"

            output_buffer.seek(0)
            resp = make_response(send_file(
                output_buffer,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                as_attachment=True,
                download_name=filename
            ))
            return resp

        if tipo_gestion == 'pedido':
            # --- Pedido (paleta azul) ---
            # 1) Normalización de generales
            cliente = str(form_data.get('cliente', '')).strip()
            ruc = str(form_data.get('documento_cliente', '')).strip()
            codigo = str(form_data.get('codigo_cliente', '')).strip()
            fecha_raw = str(form_data.get('fecha', '')).strip()

            # Formateo fecha dd-mm-yy si llega en ISO
            try:
                dt = datetime.fromisoformat(fecha_raw[:10])
                fecha_ddmmyy = dt.strftime('%d-%m-%y')
            except Exception:
                # fallback: si ya viene dd-mm-yy la dejamos
                if len(fecha_raw) == 8 and fecha_raw[2] == '-' and fecha_raw[5] == '-':
                    fecha_ddmmyy = fecha_raw
                else:
                    # fecha actual si no viene nada válido
                    fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

            # 2) DataFrame con columnas exactas y orden
            df = pd.DataFrame(list_data)
            # Asegurar columnas requeridas
            for col in ["codigo", "cod_ean", "nombre", "cantidad", "peso", "observaciones"]:
                if col not in df.columns:
                    df[col] = "" if col in ("cod_ean", "observaciones", "nombre") else 0
            df = df[["codigo", "cod_ean", "nombre", "cantidad", "peso", "observaciones"]]

            # 3) Crear XLSX en memoria
            output_buffer = io.BytesIO()
            with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
                # Nombre de la hoja activa: exactamente "pedido"
                sheet_name = "pedido"
                # Encabezados en fila 7, DATOS DESDE FILA 8 (startrow=7, sin encabezados)
                df.to_excel(writer, sheet_name=sheet_name, startrow=7, index=False, header=False)

                ws = writer.sheets[sheet_name] # Obtenemos la hoja de trabajo directamente

                # Paleta azul: usar siempre STYLE_CONFIG["pedido"]
                style_info = STYLE_CONFIG["pedido"]
                header_fill = PatternFill(start_color=style_info['header_color'], end_color=style_info['header_color'], fill_type="solid")
                header_font = Font(bold=True, color=style_info['font_color'])

                # Limpieza previa (sobrescribir) en rango A7:F(7 + len(df) + 5)
                max_row_clear = 7 + max(len(df) + 5, 20)
                for r in range(7, max_row_clear + 1):
                    for c in range(1, 7):
                        ws.cell(row=r, column=c, value=None)

                # Título y generales (azul)
                ws.cell(row=1, column=1, value="hoja de pedido").font = header_font
                ws.cell(row=1, column=1).fill = header_fill

                ws.cell(row=2, column=1, value="Cliente").font = header_font
                ws.cell(row=2, column=1).fill = header_fill
                ws.cell(row=2, column=2, value=cliente)

                ws.cell(row=3, column=1, value="RUC o DNI").font = header_font
                ws.cell(row=3, column=1).fill = header_fill
                ws.cell(row=3, column=2, value=ruc)

                ws.cell(row=4, column=1, value="Código Cliente").font = header_font
                ws.cell(row=4, column=1).fill = header_fill
                ws.cell(row=4, column=2, value=codigo)

                ws.cell(row=5, column=1, value="Fecha").font = header_font
                ws.cell(row=5, column=1).fill = header_fill
                ws.cell(row=5, column=2, value=fecha_ddmmyy)

                # Fila 6 vacía (separador)

                # Encabezados en fila 7 (azul)
                headers = ["codigo", "cod_ean", "nombre", "cantidad", "peso", "observaciones"]
                header_row = 7
                for idx, h in enumerate(headers, start=1):
                    ws.cell(row=header_row, column=idx, value=h)
                    cell = ws.cell(row=header_row, column=idx)
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                # Formatos a partir de fila 8 (datos)
                for r in range(8, 8 + len(df)):
                    ws.cell(row=r, column=4).number_format = "0"         # cantidad
                    ws.cell(row=r, column=5).number_format = "#,##0.00"  # peso

                # Totales: dejar una fila en blanco tras data
                total_row = 8 + len(df) + 1
                ws.cell(row=total_row, column=1, value="totales").font = header_font
                ws.cell(row=total_row, column=1).fill = header_fill

                # Sumas con fórmulas de Excel para que sea dinámico
                if len(df) > 0:
                    start_row_data = 8
                    end_row_data = 7 + len(df)
                    # Total Cantidad (Columna D)
                    total_cantidad_cell = ws.cell(row=total_row, column=4)
                    total_cantidad_cell.value = f"=SUM(D{start_row_data}:D{end_row_data})"
                    total_cantidad_cell.number_format = "0"
                    # Total Peso (Columna E) usando SUMPRODUCT(cantidad * peso_unitario)
                    total_peso_cell = ws.cell(row=total_row, column=5)
                    total_peso_cell.value = f"=SUMPRODUCT(D{start_row_data}:D{end_row_data},E{start_row_data}:E{end_row_data})"
                    total_peso_cell.number_format = "#,##0.00"
                else:
                    ws.cell(row=total_row, column=4, value=0).number_format = "0"
                    ws.cell(row=total_row, column=5, value=0).number_format = "#,##0.00"
                # Autosize
                autosize_columns(ws)

            # Nombre de archivo
            safe_cliente = cliente.strip().replace(" ", "_")
            filename = f"pedido_{safe_cliente}_{fecha_ddmmyy}.xlsx"

            output_buffer.seek(0)
            resp = make_response(send_file(
                output_buffer,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                as_attachment=True,
                download_name=filename
            ))
            return resp
        # --- FIN rama PEDIDO ---
        
        # --- B. Preparación de Datos y Nombre de Archivo ---  (comportamiento por defecto para otros tipos)
        cliente_o_colaborador = form_data.get('cliente', form_data.get('colaborador', form_data.get('nombre', 'N_A')))
        fecha_actual = datetime.now().strftime("%d_%m_%y")
        filename = f"{tipo_gestion}-{cliente_o_colaborador}-{fecha_actual}.xlsx"

        # --- C. Creación de los DataFrames con Pandas ---
        # DataFrame para la tabla principal del reporte.
        if not list_data: # Si la lista está vacía, se crea un DataFrame vacío con columnas.
            df_reporte = pd.DataFrame(columns=['codigo', 'nombre', 'cantidad', 'observaciones'])
        else:
            df_reporte = pd.DataFrame(list_data)

        # DataFrame para la sección de "Datos Generales".
        # Se convierte el diccionario del formulario en una lista de pares (clave, valor).
        df_generales = pd.DataFrame(list(form_data.items()), columns=['Campo', 'Valor'])

        # --- D. Creación del Archivo Excel en Memoria ---
        # Se usa `io.BytesIO` para simular un archivo en la memoria RAM.
        # Esto evita tener que escribir y luego leer un archivo del disco, mejorando el rendimiento.
        output_buffer = io.BytesIO()

        # Se inicializa `ExcelWriter` de pandas, usando `openpyxl` como motor
        # para poder acceder a sus funcionalidades de estilo.
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            
            # --- E. Escritura de los DataFrames en la Hoja de Cálculo ---
            # Se define el nombre de la hoja.
            sheet_name = 'Reporte'

            # Se escribe el DataFrame de datos generales, empezando en la fila 1 (índice 0).
            df_generales.to_excel(writer, sheet_name=sheet_name, startrow=1, index=False, header=False)
            
            # Se escribe el DataFrame del reporte final, dejando espacio suficiente.
            # Se calcula la fila de inicio basándose en el tamaño de la sección anterior.
            start_row_reporte = len(df_generales) + 5
            df_reporte.to_excel(writer, sheet_name=sheet_name, startrow=start_row_reporte, index=False)

            # --- F. Estilizado del Excel con Openpyxl ---
            # Se obtiene el objeto `workbook` (el archivo Excel) y `worksheet` (la hoja activa).
            worksheet = writer.sheets[sheet_name] # Obtenemos la hoja de trabajo directamente

            # Se obtienen los colores del diccionario de configuración.
            style_info = STYLE_CONFIG.get(tipo_gestion, STYLE_CONFIG['default'])
            header_fill = PatternFill(start_color=style_info['header_color'], end_color=style_info['header_color'], fill_type="solid")
            header_font = Font(bold=True, color=style_info['font_color'])

            # --- Estilo para las secciones y encabezados de tabla ---
            # Título para "Datos Generales"
            worksheet.cell(row=1, column=1, value="Datos Generales").font = header_font
            worksheet.cell(row=1, column=1).fill = header_fill

            # Título para "Búsqueda y Selección" (marcador de posición)
            # Esta sección se reserva para futuras funcionalidades.
            placeholder_row = len(df_generales) + 3
            worksheet.cell(row=placeholder_row, column=1, value="Búsqueda y Selección").font = header_font
            worksheet.cell(row=placeholder_row, column=1).fill = header_fill
            worksheet.cell(row=placeholder_row + 1, column=1, value="(Esta sección puede usarse para filtros o resúmenes intermedios)")

            # Título para "Reporte Final"
            worksheet.cell(row=start_row_reporte, column=1, value="Reporte Final").font = header_font
            worksheet.cell(row=start_row_reporte, column=1).fill = header_fill

            # Se aplica el estilo a los encabezados de la tabla de reporte.
            for col_num, column_title in enumerate(df_reporte.columns, 1):
                cell = worksheet.cell(row=start_row_reporte + 1, column=col_num)
                cell.font = header_font
                cell.fill = header_fill

            # --- Ajuste del ancho de las columnas ---
            # Se itera sobre todas las columnas de la hoja para ajustar su ancho
            # al contenido más largo, mejorando la legibilidad.
            for column_cells in worksheet.columns:
                max_length = 0
                column = column_cells[0].column_letter # Obtener la letra de la columna
                for cell in column_cells:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(cell.value)
                    except Exception:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column].width = adjusted_width

        # --- G. Preparación y Envío de la Respuesta ---
        # Se posiciona el "cursor" del buffer al inicio del stream.
        output_buffer.seek(0)

        # Se utiliza `send_file` de Flask para enviar el buffer como un archivo.
        return send_file(
            output_buffer,
            # Se define el tipo MIME para archivos .xlsx.
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            # Se indica que el archivo es un adjunto para que el navegador lo descargue.
            as_attachment=True,
            # Se establece el nombre del archivo que verá el usuario.
            download_name=filename
        )

    except Exception as e:
        # Si ocurre cualquier error durante el proceso, se devuelve una respuesta
        # JSON con el mensaje de error y un código de estado 500.
        app.logger.error(f"Error al exportar a XLSX: {e}")
        return jsonify({"error": f"Ocurrió un error interno: {str(e)}"}), 500

# --- 5. Bloque de Ejecución Principal ---
# Este bloque se ejecuta solo si el script es llamado directamente (ej: `python app.py`).
# No se ejecutará si es importado por otro módulo (como haría Gunicorn en producción).
# --- 4.1. Utilidades de normalización ---
def normalize_text(value: Any) -> str:
    """
    Normaliza strings a minúsculas, sin acentos/diacríticos y con espacios colapsados.
    Si no es string, lo convierte a string.
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    # quitar diacríticos
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    # minúsculas
    value = value.lower()
    # trim y colapsar espacios
    value = " ".join(value.strip().split())
    return value

def parse_dd_mm_yy(date_str: str) -> str:
    """
    Valida/parsea una fecha dd-mm-yy y la devuelve en el mismo formato estándar.
    Lanza ValueError si no es válida.
    """
    dt = datetime.strptime(date_str, "%d-%m-%y")
    return dt.strftime("%d-%m-%y")

def autosize_columns(ws):
    """Autoajusta el ancho de columnas según contenido."""
    for column_cells in ws.columns:
        max_length = 0
        col_letter = column_cells[0].column_letter
        for cell in column_cells:
            try:
                if cell.value is not None:
                    max_length = max(max_length, len(str(cell.value)))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = max_length + 2

# --- 4.2. Endpoint específico: Devoluciones ---
@app.route('/export/devoluciones', methods=['POST'])
def export_devoluciones():
    """
    Recibe:
    {
      "cliente": {"nombre": str, "ruc": str, "codigo": str},
      "fecha": "dd-mm-yy",
      "items": [
        {"codigo": str, "nombre": str, "peso": number, "cantidad": number, "observacion": str}
      ]
    }
    Devuelve XLSX formateado.
    """
    try:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}

        cliente: Dict[str, Any] = payload.get("cliente", {})
        fecha_str: str = payload.get("fecha", "")
        items: List[Dict[str, Any]] = payload.get("items", [])

        # Validación mínima
        if not items:
            return jsonify({"error": "items no puede estar vacío"}), 400
        if not fecha_str:
            return jsonify({"error": "fecha es requerida (formato dd-mm-yy)"}), 400

        # Validar y normalizar fecha
        try:
            fecha_dd_mm_yy = parse_dd_mm_yy(fecha_str)
        except ValueError:
            return jsonify({"error": "fecha inválida, use formato dd-mm-yy"}), 400

        # Normalización de cliente
        nom_cliente = normalize_text(cliente.get("nombre", ""))
        ruc = normalize_text(cliente.get("ruc", ""))
        codigo = normalize_text(cliente.get("codigo", ""))
        # motivo viene del front como FALLA_DE_FABRICA / ACUERDOS_COMERCIALES (ya en mayúsculas con guiones)
        # Compatibilidad: aceptar también 'motivo_devolucion' si el front aún lo envía con ese nombre
        motivo_raw = (payload.get("motivo") or payload.get("motivo_devolucion") or "").strip()
        motivo_map = {
            "FALLA_DE_FABRICA": "Falla de fábrica",
            "ACUERDOS_COMERCIALES": "Acuerdos comerciales",
        }
        motivo_legible = motivo_map.get(motivo_raw, "")
        motivo_norm = normalize_text(motivo_legible)

        # Normalización de items y cálculos
        norm_items: List[Dict[str, Any]] = []
        total_unidades = 0
        peso_total = 0.0

        for it in items:
            codigo_it = normalize_text(it.get("codigo", ""))
            cod_ean_it = normalize_text(it.get("cod_ean", ""))
            nombre_it = normalize_text(it.get("nombre", ""))
            observ = normalize_text(it.get("observacion", ""))
            try:
                peso_val = float(it.get("peso", 0) or 0)
            except Exception:
                peso_val = 0.0
            try:
                cantidad_val = int(it.get("cantidad", 0) or 0)
            except Exception:
                # aceptar float y truncar
                try:
                    cantidad_val = int(float(it.get("cantidad", 0) or 0))
                except Exception:
                    cantidad_val = 0

            subtotal_peso = round(peso_val * cantidad_val, 4)
            total_unidades += cantidad_val
            peso_total += subtotal_peso

            norm_items.append({
                "codigo": codigo_it,
                "cod_ean": cod_ean_it,
                "nombre": nombre_it,
                "peso": peso_val,
                "cantidad": cantidad_val,
                "observacion": observ,
                "subtotal_peso": subtotal_peso
            })

        # DataFrame principal
        # Añadimos columna EAN y reordenamos: Código | Cod. EAN | Nombre | Cantidad | Peso | Observación | Subtotal Peso
        df = pd.DataFrame(
            norm_items,
            columns=["codigo", "cod_ean", "nombre", "cantidad", "peso", "observacion", "subtotal_peso"]
        )
        # Si el front aún no manda 'cod_ean', crea la columna vacía para que aparezca en el XLSX
        if "cod_ean" not in df.columns:
            df["cod_ean"] = ""
            df = df[["codigo", "cod_ean", "nombre", "cantidad", "peso", "observacion", "subtotal_peso"]]

        # Crear XLSX en memoria
        output_buffer = io.BytesIO()
        with pd.ExcelWriter(output_buffer, engine="openpyxl") as writer:
            # Título de hoja según motivo
            sheet_name = motivo_legible if motivo_legible else "Devoluciones"
            # Queremos:
            # - Fila 7 vacía
            # - Encabezados en fila 8
            # - Datos desde fila 9
            # Por ello:
            # 1) Escribimos SOLO LOS DATOS comenzando en fila 9 (startrow=8) sin encabezados.
            # 2) Luego escribimos manualmente los encabezados en fila 8.
            df.to_excel(writer, sheet_name=sheet_name, startrow=8, index=False, header=False)

            ws = writer.sheets[sheet_name] # Obtenemos la hoja de trabajo directamente

            # Encabezado
            style_info = STYLE_CONFIG["devoluciones"]
            header_fill = PatternFill(start_color=style_info['header_color'], end_color=style_info['header_color'], fill_type="solid")
            header_font = Font(bold=True, color=style_info['font_color'])

            ws.cell(row=1, column=1, value="reporte de devoluciones").font = header_font
            ws.cell(row=1, column=1).fill = header_fill

            ws.cell(row=2, column=1, value="Cliente").font = header_font
            ws.cell(row=2, column=2, value=nom_cliente)
            ws.cell(row=3, column=1, value="RUC o DNI").font = header_font
            ws.cell(row=3, column=2, value=ruc)
            ws.cell(row=4, column=1, value="Código Cliente").font = header_font
            ws.cell(row=4, column=2, value=codigo)
            ws.cell(row=5, column=1, value="Fecha").font = header_font
            ws.cell(row=5, column=2, value=fecha_dd_mm_yy)
            # Motivo de devolución en el encabezado si viene
            if motivo_legible:
                ws.cell(row=6, column=1, value="Motivo de Devolución").font = header_font
                ws.cell(row=6, column=1).fill = header_fill
                ws.cell(row=6, column=2, value=motivo_legible)

            # Estilo y escritura de encabezados de la tabla EN LA FILA 8 (manual)
            header_row = 8
            for col_idx, col_name in enumerate(df.columns, 1):
                # Escribir el texto del encabezado
                ws.cell(row=header_row, column=col_idx, value=col_name)
                # Aplicar estilos
                cell = ws.cell(row=header_row, column=col_idx)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")

            # Formatos numéricos según nuevo orden
            # columnas: 1=codigo, 2=ean, 3=nombre, 4=cantidad, 5=peso, 6=observacion, 7=subtotal_peso
            # Datos comienzan en fila 9 (header en fila 8)
            for r in range(9, 9 + len(df)):
                ws.cell(row=r, column=4).number_format = "0"         # cantidad
                ws.cell(row=r, column=5).number_format = "#,##0.00"  # peso
                ws.cell(row=r, column=7).number_format = "#,##0.00"  # subtotal_peso

            # Totales
            # Totales: después de los datos, dejando una fila en blanco
            total_row = 9 + len(df) + 1
            ws.cell(row=total_row, column=1, value="totales").font = header_font
            ws.cell(row=total_row, column=1).fill = header_fill
            ws.cell(row=total_row, column=4, value=total_unidades)                  # cantidad total
            ws.cell(row=total_row, column=7, value=round(peso_total, 4)).number_format = "#,##0.00"  # subtotal_peso total

            autosize_columns(ws)

        output_buffer.seek(0)

        # Nombre de archivo: devoluciones_<motivo>_<cliente>_<fecha>.xlsx
        # Usamos motivo y nombre de cliente para un nombre más descriptivo y seguro.
        safe_motivo = motivo_norm.replace(" ", "_") if motivo_norm else "general"
        safe_cliente = (nom_cliente or codigo or "sin_nombre").replace(" ", "_")
        filename = f"devoluciones_{safe_motivo}_{safe_cliente}_{fecha_dd_mm_yy}.xlsx"

        resp = make_response(send_file(
            output_buffer,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        ))
        return resp

    except Exception as e:
        app.logger.error(f"Error en /export/devoluciones: {e}")
        return jsonify({"error": f"error interno: {str(e)}"}), 500

# --- 5. Bloque de Ejecución Principal ---
if __name__ == '__main__':
    # Se inicia el servidor en modo de depuración, que se recarga automáticamente
    # con cada cambio en el código.
    app.run(debug=True, port=5000)
