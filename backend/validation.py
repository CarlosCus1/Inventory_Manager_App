from functools import wraps
from flask import request, jsonify
import json
import os
from jsonschema import validate, ValidationError
import logging

SCHEMAS_DIR = os.path.join(os.path.dirname(__file__), '..', 'schemas')

def validate_with_schema():
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            logging.info(f"Received data for validation: {data}")
            if not data or 'tipo' not in data:
                return jsonify({"error": "Missing 'tipo' in request body"}), 400

            schema_name = data.get('tipo')
            try:
                schema_path = os.path.join(SCHEMAS_DIR, f"{schema_name}.schema.json")
                with open(schema_path) as file:
                    schema = json.load(file)
                
                validate(instance=data, schema=schema)
            except FileNotFoundError:
                logging.error(f"Schema '{schema_name}.schema.json' not found.")
                return jsonify({"error": f"Schema '{schema_name}.schema.json' not found."}), 500
            except ValidationError as e:
                logging.error(f"Validation Error: {e.message}")
                return jsonify({"error": "Invalid JSON", "message": e.message}), 400
            return f(*args, **kwargs)
        return wrapper
    return decorator