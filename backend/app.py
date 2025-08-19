# -*- coding: utf-8 -*-
# --------------------------------------------------------------------------- #
#                       backend/app.py - Versión Refactorizada                #
#                                                                             #
# --------------------------------------------------------------------------- #

# --- 1. Importaciones necesarias ---
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd # type: ignore
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter
from datetime import datetime
import io
import unicodedata
from typing import Any, Dict, List, Optional
from openpyxl.worksheet.worksheet import Worksheet
from report_generators.base_generator import BaseReportGenerator
from report_generators.inventario_generator import InventarioReportGenerator
from report_generators.pedido_generator import PedidoReportGenerator
from report_generators.devoluciones_generator import DevolucionesReportGenerator
from report_generators.precios_generator import PreciosReportGenerator
from report_generators.planificador_generator import PlanificadorReportGenerator

# --- 2. Inicialización de la aplicación Flask ---
app = Flask(__name__)
# Permitimos solicitudes CORS de cualquier origen para el desarrollo
# En producción, se recomienda restringir esto a dominios específicos
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, expose_headers=["Content-Disposition"])

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


# --- 5. Definición de Endpoints ---

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """
    Endpoint para calcular la distribución de montos.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        monto_total_str = data.get('montoTotal')
        fechas_validas = data.get('fechasValidas')

        if not monto_total_str or not fechas_validas:
            return jsonify({"error": "Faltan 'montoTotal' o 'fechasValidas' en la petición"}), 400
        
        try:
            monto_total = float(monto_total_str)
        except (ValueError, TypeError):
            return jsonify({"error": "'montoTotal' debe ser un número válido"}), 400

        if not isinstance(fechas_validas, list) or len(fechas_validas) == 0:
            return jsonify({"error": "'fechasValidas' debe ser una lista no vacía de fechas"}), 400

        num_fechas = len(fechas_validas)
        monto_base = monto_total / num_fechas
        
        # Redondear a 2 decimales
        monto_base_redondeado = round(monto_base, 2)
        
        montos_asignados = {fecha: monto_base_redondeado for fecha in fechas_validas}
        
        # Ajustar el último pago para que la suma total sea exacta
        total_calculado = sum(montos_asignados.values())
        diferencia = round(monto_total - total_calculado, 2)
        
        if diferencia != 0 and fechas_validas:
            ultima_fecha = fechas_validas[-1]
            montos_asignados[ultima_fecha] += diferencia
            montos_asignados[ultima_fecha] = round(montos_asignados[ultima_fecha], 2)

        # Calcular resumen mensual
        resumen_mensual = {}
        for fecha_str, monto in montos_asignados.items():
            try:
                # Se asume que el formato de fecha es 'DD/MM/YYYY'
                fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y')
                mes_anio = fecha_obj.strftime('%Y-%m') # Formato 'YYYY-MM'
                
                if mes_anio in resumen_mensual:
                    resumen_mensual[mes_anio] += monto
                else:
                    resumen_mensual[mes_anio] = monto
            except ValueError:
                # Manejar fechas con formato incorrecto si es necesario
                app.logger.warning(f"Formato de fecha inválido encontrado: {fecha_str}")
                continue # O manejar el error de otra forma

        # Redondear los totales mensuales a 2 decimales
        for mes, total in resumen_mensual.items():
            resumen_mensual[mes] = round(total, 2)

        return jsonify({
            "montosAsignados": montos_asignados,
            "resumenMensual": resumen_mensual,
            "fechasValidas": sorted(fechas_validas, key=lambda d: datetime.strptime(d, '%d/%m/%Y'))
        })

    except Exception as e:
        app.logger.error(f"Error en /api/calculate: {e}")
        return jsonify({"error": f"Ocurrió un error interno: {str(e)}"}), 500


@app.route('/api/consultar-ruc', methods=['GET'])
def consultar_ruc():
    """
    Endpoint mock para consultar RUC/DNI.
    """
    numero = request.args.get('numero', '')
    if not numero.isdigit():
        return jsonify({"error": "El número de documento debe contener solo dígitos."}), 400

    if len(numero) == 11:
        # Simula una respuesta para un RUC
        return jsonify({
            "razonSocial": f"EMPRESA FICTICIA {numero}",
            "estado": "ACTIVO",
            "condicion": "HABIDO"
        })
    elif len(numero) == 8:
        # Simula una respuesta para un DNI
        return jsonify({
            "razonSocial": f"PERSONA FICTICIA {numero}",
            "estado": "ACTIVO",
            "condicion": "HABIDO"
        })
    else:
        return jsonify({"error": "El número de documento debe tener 8 u 11 dígitos."}), 400


@app.route('/api/getHolidays', methods=['GET'])
def get_holidays():
    """
    Endpoint para obtener los días festivos. Actualmente solo soporta 2025.
    """
    # Se obtiene el año de los argumentos, por defecto 2025 si no se especifica.
    year = request.args.get('year', default=2025, type=int)
    if year == 2025:
        return jsonify(HOLIDAYS_2025)
    else:
        # Para cualquier otro año, devuelve una lista vacía con estado 200 OK.
        # Esto evita que los servidores de desarrollo devuelvan index.html en un 404.
        return jsonify([])

REPORT_GENERATORS = {
    'inventario': InventarioReportGenerator,
    'pedido': PedidoReportGenerator,
    'devoluciones': DevolucionesReportGenerator,
    'precios': PreciosReportGenerator,
    'planificador': PlanificadorReportGenerator,
}

@app.route('/export-xlsx', methods=['POST'])
def export_xlsx():
    """
    Endpoint principal que recibe datos JSON, genera un archivo Excel
    con formato y lo envía como una descarga.
    """
    try:
        data = request.get_json()
        if not data or 'tipo' not in data or 'form' not in data or 'list' not in data:
            # For planificador, 'list' might be empty, but 'data' should be present
            if data.get('tipo') == 'planificador' and 'data' not in data:
                return jsonify({"error": "Faltan datos en la petición para planificador (se requiere 'tipo', 'form' y 'data')"}), 400
            elif data.get('tipo') != 'planificador':
                return jsonify({"error": "Faltan datos en la petición (se requiere 'tipo', 'form' y 'list')"}), 400

        tipo_gestion = data.get('tipo', 'desconocido')
        form_data = data.get('form', {})
        list_data = data.get('list', [])
        planner_data = data.get('data', {}) # For planificador

        GeneratorClass = REPORT_GENERATORS.get(tipo_gestion)

        if not GeneratorClass:
            return jsonify({"error": f"Tipo de reporte no válido: {tipo_gestion}"}), 400

        output_buffer = io.BytesIO()
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            if tipo_gestion == 'planificador':
                generator = GeneratorClass(writer, form_data, list_data, planner_data)
            else:
                generator = GeneratorClass(writer, form_data, list_data)
            generator.generate()

        output_buffer.seek(0)
        
        # Get filename from the generator instance if it was set
        filename = getattr(generator, 'filename', f"{tipo_gestion}_report.xlsx")

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