import json
import os
from typing import List, Optional

try:
    from pydantic import BaseModel, EmailStr, Field
except ImportError:
    print("Pydantic or email-validator is not installed. Please run 'pip install pydantic[email]'")
    exit(1)

# --- Pydantic Models based on Zod Schemas ---

class Producto(BaseModel):
    codigo: str = Field(..., min_length=1)
    cod_ean: str
    ean_14: str
    nombre: str = Field(..., min_length=1)
    linea: str
    peso: float = Field(..., ge=0)
    stock_referencial: int = Field(..., ge=0)
    precio_referencial: Optional[float] = Field(None, ge=0)
    cantidad_por_caja: Optional[int] = Field(None, gt=0)
    keywords: List[str]

class ProductoEditado(Producto):
    cantidad: int = Field(..., gt=0)
    observaciones: Optional[str] = None
    precios: Optional[dict[str, float]] = None
    precio_sugerido: Optional[float] = Field(None, ge=0)

class Form(BaseModel):
    documentType: Optional[str] = None # Literal['ruc', 'dni']
    cliente: Optional[str] = None
    documento_cliente: Optional[str] = None
    codigo_cliente: Optional[str] = None
    fecha: Optional[str] = None
    marca1: Optional[str] = None
    marca2: Optional[str] = None
    marca3: Optional[str] = None
    marca4: Optional[str] = None
    marca5: Optional[str] = None
    sucursal: Optional[str] = None
    montoOriginal: Optional[float] = None

class Usuario(BaseModel):
    nombre: str
    correo: EmailStr

class ExportBase(BaseModel):
    list: List[ProductoEditado]
    usuario: Usuario

class InventarioExport(ExportBase):
    tipo: str # Literal['inventario']
    form: Form

class PedidoExport(ExportBase):
    tipo: str # Literal['pedido']
    form: Form

class DevolucionesExport(ExportBase):
    tipo: str # Literal['devoluciones']
    form: Form

class PreciosExport(ExportBase):
    tipo: str # Literal['precios']
    form: Form

# New model to combine all exports
class AllSchemasExport(BaseModel):
    inventario: InventarioExport
    pedido: PedidoExport
    devoluciones: DevolucionesExport
    precios: PreciosExport

# --- Schema Generation ---

schemas_dir = "..\schemas"

if not os.path.exists(schemas_dir):
    os.makedirs(schemas_dir)

# Generate a single consolidated schema file
all_schema_path = os.path.join(schemas_dir, "all_schemas.schema.json")
with open(all_schema_path, "w") as f:
    f.write(json.dumps(AllSchemasExport.model_json_schema(), indent=2))
print(f"Generated consolidated schema at {all_schema_path}")

# Remove individual schema files if they exist
for name in ["inventario", "pedido", "devoluciones", "precios"]:
    schema_path = os.path.join(schemas_dir, f"{name}.schema.json")
    if os.path.exists(schema_path):
        os.remove(schema_path)
        print(f"Removed individual schema file: {schema_path}")
