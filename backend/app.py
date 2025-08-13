# -*- coding: utf-8 -*-
# --------------------------------------------------------------------------- #
#                       backend/app.py - Versión Refactorizada                #
#                                                                             #
# --------------------------------------------------------------------------- #

# --- 1. Importaciones necesarias ---
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter
from datetime import datetime
import io
import unicodedata
from typing import Any, Dict, List, Optional

# --- 2. Inicialización de la aplicación Flask ---
app = Flask(__name__)
# Permitimos solicitudes CORS de cualquier origen para el desarrollo
# En producción, se recomienda restringir esto a dominios específicos
CORS(app, expose_headers=["Content-Disposition"])

# --- 3. Configuración de Estilos y Datos ---
# Un diccionario para centralizar los colores y estilos de los encabezados.
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

@app.route('/export-xlsx', methods=['POST'])
def export_xlsx():
    """
    Endpoint principal que recibe datos JSON, genera un archivo Excel
    con formato y lo envía como una descarga.
    """
    try:
        # --- A. Recepción y Validación de Datos ---
        data = request.get_json()
        if not data or 'tipo' not in data or 'form' not in data or 'list' not in data:
            return jsonify({"error": "Faltan datos en la petición (se requiere 'tipo', 'form' y 'list')"}), 400

        tipo_gestion = data.get('tipo', 'desconocido')
        form_data = data.get('form', {})
        list_data = data.get('list', [])

        # Se crea un buffer en memoria y un escritor de Excel.
        output_buffer = io.BytesIO()
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            
            # --- B. Procesamiento por Tipo de Gestión ---
            
            # --- Caso 1: Comparación de Precios ---
            if tipo_gestion == 'precios':
                # Normalización de datos generales
                colaborador = str(form_data.get('colaborador', '')).strip()
                marcas_finales: List[str] = []
                for i in range(1, 6):
                    marca_ingresada = str(form_data.get(f"marca{i}", "")).strip()
                    marcas_finales.append(marca_ingresada if marca_ingresada else f"Marca {i}")
                
                fecha_raw = str(form_data.get('fecha', '')).strip()
                try:
                    dt = datetime.fromisoformat(fecha_raw.replace('Z', '+00:00'))
                    fecha_ddmmyy = dt.strftime('%d-%m-%y')
                except (ValueError, TypeError):
                    fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

                # Preparación de filas para el DataFrame
                rows: list[dict] = []
                for it in list_data:
                    row = {
                        "codigo": str(it.get("codigo", "")).strip(),
                        "cod_ean": str(it.get("cod_ean", "")).strip(),
                        "nombre": str(it.get("nombre", "")).strip()
                    }
                    precios_map = it.get("precios", {})
                    for i, marca_nombre in enumerate(marcas_finales):
                        # Se usa el nombre de marca de los datos del formulario, no el genérico.
                        marca_key = str(form_data.get(f"marca{i+1}", "")).strip()
                        precio_val = precios_map.get(marca_key)
                        try:
                            # Si el valor no es válido, se usa None
                            row[marca_nombre] = float(precio_val) if precio_val is not None and precio_val != '' else None
                        except (ValueError, TypeError):
                            row[marca_nombre] = None
                    rows.append(row)

                df_columns = ["codigo", "cod_ean", "nombre"] + marcas_finales
                df = pd.DataFrame(rows, columns=df_columns)
                sheet_name = "comparacion"
                # Escribimos los datos en la fila 12, dejando espacio para la información general
                df.to_excel(writer, sheet_name=sheet_name, startrow=11, index=False, header=False)
                ws = writer.sheets[sheet_name]

                # Estilos y formateo
                style_info = STYLE_CONFIG["precios"]
                header_fill = PatternFill(start_color=style_info['header_color'], fill_type="solid")
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
                ws.cell(row=fecha_row + 1, column=1, value="Total Productos:").font = header_font
                ws.cell(row=fecha_row + 1, column=1).fill = header_fill
                ws.cell(row=fecha_row + 1, column=2, value=len(list_data)).number_format = "0"
                
                # Encabezados de la tabla
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
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")

                # Fórmulas y formatos
                for r_idx in range(len(df)):
                    row_num = 12 + r_idx
                    p_base_ref = f"D{row_num}"
                    
                    # Referencias de los precios de los competidores
                    p_comp_refs = [f"{get_column_letter(4+i)}{row_num}" for i in range(1, len(marcas_finales))]

                    # Formato de moneda para los precios
                    for i in range(len(marcas_finales)):
                        ws.cell(row=row_num, column=4 + i).number_format = currency_format

                    col_offset = 4 + len(marcas_finales)
                    for i in range(len(marcas_finales) - 1):
                        comp_ref = p_comp_refs[i]
                        # Columna para la diferencia
                        dif_col = col_offset + i * 2 + 1
                        dif_cell = ws.cell(row=row_num, column=dif_col)
                        dif_cell.value = f'=IFERROR({p_base_ref}-{comp_ref}, "")'
                        dif_cell.number_format = currency_format
                        # Columna para el porcentaje
                        pct_col = col_offset + i * 2 + 2
                        pct_cell = ws.cell(row=row_num, column=pct_col)
                        pct_cell.value = f'=IFERROR(({p_base_ref}/{comp_ref})-1, "")'
                        pct_cell.number_format = percentage_format
                    
                    # Fórmulas para precios MAX/MIN
                    price_range_cols = get_column_letter(4) + ":" + get_column_letter(3 + len(marcas_finales))
                    price_range = f"{price_range_cols}{row_num}"
                    
                    summary_price_start_col = col_offset + (len(marcas_finales)-1) * 2 + 1
                    max_price_ref = f"{get_column_letter(summary_price_start_col)}{row_num}"
                    min_price_ref = f"{get_column_letter(summary_price_start_col + 1)}{row_num}"

                    ws[max_price_ref] = f'=IFERROR(MAX({price_range}), "")'
                    ws[min_price_ref] = f'=IFERROR(MIN({price_range}), "")'
                    for cell_ref in [max_price_ref, min_price_ref]:
                        ws[cell_ref].number_format = currency_format

                    # Fórmulas para porcentajes MAX/MIN
                    pct_comp_refs = [f"{get_column_letter(col_offset + i*2 + 2)}{row_num}" for i in range(len(marcas_finales)-1)]
                    summary_pct_start_col = summary_price_start_col + 2
                    max_pct_ref = f"{get_column_letter(summary_pct_start_col)}{row_num}"
                    min_pct_ref = f"{get_column_letter(summary_pct_start_col + 1)}{row_num}"

                    ws[max_pct_ref] = f'=IFERROR(MAX({",".join(pct_comp_refs)}), "")'
                    ws[min_pct_ref] = f'=IFERROR(MIN({",".join(pct_comp_refs)}), "")'
                    for cell_ref in [max_pct_ref, min_pct_ref]:
                        ws[cell_ref].number_format = percentage_format
                
                # Autoajuste de columnas
                autosize_columns(ws)

                # Nombre de archivo
                safe_colab = unicodedata.normalize('NFKD', colaborador).encode('ascii', 'ignore').decode('utf-8').strip().replace(" ", "_") or "sin_colaborador"
                filename = f"comparacion_precios_{safe_colab}_{fecha_ddmmyy}.xlsx"

            # --- Caso 2: Inventario o Pedido (lógica unificada) ---
            elif tipo_gestion in ['inventario', 'pedido']:
                _generate_standard_report(writer, tipo_gestion, form_data, list_data)
                ws = writer.sheets[tipo_gestion]
                
                # Generación del nombre de archivo después de procesar
                cliente = str(form_data.get('cliente', '')).strip()
                fecha_raw = str(form_data.get('fecha', '')).strip()
                try:
                    dt = datetime.fromisoformat(fecha_raw.replace('Z', '+00:00'))
                    fecha_ddmmyy = dt.strftime('%d-%m-%y')
                except (ValueError, TypeError):
                    fecha_ddmmyy = datetime.now().strftime('%d-%m-%y')

                safe_cliente = unicodedata.normalize('NFKD', cliente).encode('ascii', 'ignore').decode('utf-8').strip().replace(" ", "_") or "sin_cliente"
                filename = f"{tipo_gestion}_{safe_cliente}_{fecha_ddmmyy}.xlsx"

            # --- Caso 3: Por defecto (si no coincide con ningún tipo) ---
            else:
                # Se mantiene la lógica para tipos de gestión no estandarizados
                cliente_o_colaborador = form_data.get('cliente', form_data.get('colaborador', form_data.get('nombre', 'N_A')))
                fecha_actual = datetime.now().strftime("%d_%m_%y")
                filename = f"{tipo_gestion}-{cliente_o_colaborador}-{fecha_actual}.xlsx"

                if not list_data:
                    df_reporte = pd.DataFrame(columns=['codigo', 'nombre', 'cantidad', 'observaciones'])
                else:
                    df_reporte = pd.DataFrame(list_data)
                df_generales = pd.DataFrame(list(form_data.items()), columns=['Campo', 'Valor'])

                sheet_name = 'Reporte'
                df_generales.to_excel(writer, sheet_name=sheet_name, startrow=1, index=False, header=False)
                start_row_reporte = len(df_generales) + 5
                df_reporte.to_excel(writer, sheet_name=sheet_name, startrow=start_row_reporte, index=False)

                ws = writer.sheets[sheet_name]
                style_info = STYLE_CONFIG.get(tipo_gestion, STYLE_CONFIG['default'])
                header_fill = PatternFill(start_color=style_info['header_color'], fill_type="solid")
                header_font = Font(bold=True, color=style_info['font_color'])
                
                ws.cell(row=1, column=1, value="Datos Generales").font = header_font
                ws.cell(row=1, column=1).fill = header_fill
                ws.cell(row=start_row_reporte, column=1, value="Reporte Final").font = header_font
                ws.cell(row=start_row_reporte, column=1).fill = header_fill

                for col_num, column_title in enumerate(df_reporte.columns, 1):
                    cell = ws.cell(row=start_row_reporte + 1, column=col_num)
                    cell.font = header_font
                    cell.fill = header_fill

                autosize_columns(ws)

        # --- C. Preparación y Envío de la Respuesta ---
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        app.logger.error(f"Error al exportar a XLSX: {e}")
        return jsonify({"error": f"Ocurrió un error interno: {str(e)}"}), 500

# --- 6. Bloque de Ejecución Principal ---
if __name__ == '__main__':
    # La ejecución en modo debug es útil durante el desarrollo.
    app.run(debug=True, port=5000)
