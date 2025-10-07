import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# -*- coding: utf-8 -*-
# --------------------------------------------------------------------------- #
#           backend/app.py - Versión Refactorizada                             #
#                                                                             #
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
import requests # <--- Importado para llamadas a API externa
from typing import Any, Dict, List, Optional
from openpyxl.worksheet.worksheet import Worksheet
from .report_generators.base_generator import BaseReportGenerator
from .report_generators.inventario_generator import InventarioReportGenerator
from .report_generators.pedido_generator import PedidoReportGenerator
from .report_generators.devoluciones_generator import DevolucionesReportGenerator
from .report_generators.precios_generator import PreciosReportGenerator
from .constants import UserKeys
from backend.validation import validate_with_schema
import logging
import argparse # <--- Importado para leer argumentos

# --- 2. Inicialización de la aplicación Flask ---
app = Flask(__name__)

# Configuración básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Permitimos solicitudes CORS de cualquier origen para el desarrollo
# En producción, se recomienda restringir esto a dominios específicos
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "https://5173-firebase-gestion360-1759544149010.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev", "https://5174-firebase-gestion360-1759544149010.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev"]}}, supports_credentials=True, expose_headers=["Content-Disposition"])

# --- 3. Credenciales y Constantes (Mover a variables de entorno en producción) ---
API_TOKEN_SUNAT = "apis-token-16452.eFeKMZDK8KQe3dGOhwSZJ2mgag9l5MU5"
API_URL_SUNAT = "https://api.apis.net.pe/v2/sunat/ruc"


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
                mes_anio = fecha_obj.strftime('%Y-%m') # Formato 'YYYY-%m'
                
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


@app.route('/api/consultar-ruc', methods=['POST'])
def consultar_ruc():
    """
    Endpoint para consultar RUC/DNI. Ahora se conecta a la API real.
    """
    data = request.get_json()
    numero = data.get('documentNumber')

    if not numero or not numero.isdigit():
        return jsonify({"error": "El número de documento es requerido y debe contener solo dígitos."}), 400
    
    # Aunque la API soporta DNI, nos centramos en RUC según la especificación
    if len(numero) != 11:
        return jsonify({"error": "El RUC debe tener 11 dígitos."}), 400

    try:
        headers = {
            'Authorization': f'Bearer {API_TOKEN_SUNAT}',
            'Content-Type': 'application/json'
        }
        response = requests.get(f"{API_URL_SUNAT}?numero={numero}", headers=headers)

        # Propagar el error de la API externa si la solicitud no fue exitosa
        response.raise_for_status()

        return jsonify(response.json()), response.status_code

    except requests.exceptions.HTTPError as err:
        status_code = err.response.status_code
        if status_code == 404:
            return jsonify({"error": "El RUC no fue encontrado."}), 404
        elif status_code == 401:
            return jsonify({"error": "Autenticación fallida. Revisa el token de la API."}), 401
        else:
            return jsonify({"error": f"Error en el servicio de consulta: {err}"}), status_code
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error de conexión con la API de RUC: {e}")
        return jsonify({"error": "No se pudo conectar con el servicio de consulta de RUC."}), 503


REPORT_GENERATORS = {
    'inventario': InventarioReportGenerator,
    'pedido': PedidoReportGenerator,
    'devoluciones': DevolucionesReportGenerator,
    'precios': PreciosReportGenerator,
}

@app.route('/export-xlsx', methods=['POST'])
@validate_with_schema()
def export_xlsx():
    app.logger.info('Received request to /export-xlsx')
    """
    Endpoint principal que recibe datos JSON, genera un archivo Excel
    con formato y lo envía como una descarga.
    """
    try:
        data = request.get_json()

        tipo_gestion = data.get('tipo', 'desconocido')
        form_data = data.get('form', {})
        list_data = data.get('list', [])
        usuario_data = data.get('usuario', {})
        totales_data = data.get('totales', {})

        GeneratorClass = REPORT_GENERATORS.get(tipo_gestion)

        if not GeneratorClass:
            return jsonify({"error": f"Tipo de reporte no válido: {tipo_gestion}"}), 400

        output_buffer = io.BytesIO()
        with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
            generator = GeneratorClass(writer, form_data, list_data, data=totales_data, usuario_data=usuario_data)
            generator.generate()

        output_buffer.seek(0)

        filename = generator.get_filename()

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
    # Configurar el parser de argumentos para leer el puerto
    parser = argparse.ArgumentParser(description='Run a Flask web server.')
    parser.add_argument('--port', type=int, default=5001, help='The port to run the web server on.')
    args = parser.parse_args()

    # La ejecución en modo debug es útil durante el desarrollo.
    app.run(debug=True, port=args.port)
