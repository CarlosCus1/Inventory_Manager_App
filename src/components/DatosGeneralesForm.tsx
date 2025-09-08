// --------------------------------------------------------------------------- #
//                                                                             #
//           src/components/DatosGeneralesForm.tsx (Universal)                 #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FormGroup, Label } from './ui/FormControls';
import { StyledInput } from './ui/StyledInput';
import { StyledSelect } from './ui/StyledSelect';
import { RucDniInput } from './RucDniInput';
import { SucursalInput } from './ui/SucursalInput';
import { useRucDni } from '../hooks/useRucDni';
import { useFormValidation } from '../hooks/useFormValidation';
import { useToast } from '../contexts/ToastContext';
import type { IForm, ValidationRule, FieldConfig } from '../interfaces';

// --- 2. Definición de las Props del Componente ---
interface Props {
  tipo: 'devoluciones' | 'pedido' | 'inventario' | 'precios';
  formState: IForm; // Added formState to Props
  fieldConfig: FieldConfig;
  onFormChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // Added onFormChange
  onOpenBackupModal?: () => void;
}

// --- 3. Definición del Componente Universal ---
export const DatosGeneralesForm: React.FC<Props> = ({ tipo, fieldConfig, onOpenBackupModal }) => {
  // --- A. Conexión con el Store de Zustand ---
  const formState = useAppStore((state) => state.formState[tipo]);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);
  const setMotivoDevolucion = useAppStore((state) => state.setMotivoDevolucion);

  // --- B. Hooks y Lógica Común ---
  const variant = tipo === 'precios' ? 'comparador' : tipo;
  const {
    rucEstado,
    rucCondicion,
    isLoadingRuc,
    handleRucDniChange,
    handleRazonSocialManualChange,
  } = useRucDni(tipo);
  const { validate } = useFormValidation();
  const { addToast } = useToast();

  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Lógica de validación (se puede expandir)
    let rules: ValidationRule[] = [];
    if (name === 'fecha') {
      rules = [{ type: 'required', message: 'La fecha es obligatoria.' }, { type: 'isValidDate', message: 'La fecha no es válida.' }];
    } else if (name === 'codigo_cliente') {
      rules = [{ type: 'isNumeric', message: 'El código de cliente debe ser numérico.' }];
    } else if (name === 'documento_cliente') {
      if (formState.documentType === 'dni') rules = [{ type: 'isDni', message: 'El DNI debe tener 8 dígitos.' }];
      else if (formState.documentType === 'ruc') rules = [{ type: 'isRuc', message: 'El RUC debe tener 11 dígitos.' }];
    }

    const { isValid, errorMessage } = validate(value, rules);
    if (!isValid) {
      addToast(errorMessage!, 'error');
    }

    actualizarFormulario(tipo, name as keyof IForm, value);
  };

  // --- D. Efecto para setear la fecha actual por defecto ---
  useEffect(() => {
    if (fieldConfig.showFecha && !formState.fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      actualizarFormulario(tipo, 'fecha', hoy);
    }
  }, [tipo, formState.fecha, fieldConfig.showFecha, actualizarFormulario]);

  // --- E. Datos para Selects ---
  const motivoOptions = [
    { value: '', label: 'Seleccionar motivo...' },
    { value: 'falla_fabrica', label: 'Falla de fábrica' },
    { value: 'acuerdos_comerciales', label: 'Acuerdos comerciales' },
  ];



  // --- F. Renderizado del Componente ---
  return (
    <div className="card">
      <h2 className={`text-2xl font-bold mb-4 form-section-title title-${variant}`}>
        Datos Generales
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {fieldConfig.showRucDni && (
          <div className="lg:col-span-3">
            <RucDniInput
              documentType={formState.documentType || 'ruc'}
              documentNumber={formState.documento_cliente || ''}
              razonSocial={formState.cliente || ''}
              onDocumentChange={handleRucDniChange}
              onRazonSocialChange={handleRazonSocialManualChange}
              rucEstado={rucEstado}
              rucCondicion={rucCondicion}
              isLoading={isLoadingRuc}
              variant={variant}
            />
          </div>
        )}

        {fieldConfig.showCodigoCliente && (
          <FormGroup>
            <Label htmlFor="codigo_cliente">Código de Cliente</Label>
            <StyledInput type="text" id="codigo_cliente" name="codigo_cliente" value={formState.codigo_cliente || ''} onChange={handleChange} placeholder="Opcional" variant={variant} />
          </FormGroup>
        )}

        {fieldConfig.showSucursal && (
          <SucursalInput value={formState.sucursal || ''} onChange={handleChange} variant={variant} />
        )}

        {fieldConfig.showFecha && (
          <FormGroup>
            <Label htmlFor="fecha">Fecha</Label>
            <StyledInput type="date" id="fecha" name="fecha" value={formState.fecha || ''} onChange={handleChange} variant={variant} />
          </FormGroup>
        )}

        {fieldConfig.showColaborador && (
          <FormGroup>
            <Label htmlFor="colaborador_personal">Colaborador</Label>
            <StyledInput type="text" id="colaborador_personal" name="colaborador_personal" value={formState.colaborador_personal || ''} onChange={handleChange} placeholder="Nombre del colaborador" variant={variant} />
          </FormGroup>
        )}

        {fieldConfig.showMotivo && tipo === 'devoluciones' && (
          <FormGroup>
            <Label htmlFor="motivo">Motivo de Devolución</Label>
            <StyledSelect id="motivo" name="motivo" value={(formState as IForm & { motivo?: 'falla_fabrica' | 'acuerdos_comerciales' }).motivo || ''} onChange={(e) => setMotivoDevolucion(e.target.value as 'falla_fabrica' | 'acuerdos_comerciales')} variant={variant}>
              {motivoOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </StyledSelect>
          </FormGroup>
        )}

        {fieldConfig.showMarcas && (
          Array.from({ length: 5 }).map((_, i) => (
            <FormGroup key={i}>
              <Label htmlFor={`marca${i + 1}`}>{`Marca ${i + 1}`}</Label>
              <StyledInput type="text" id={`marca${i + 1}`} name={`marca${i + 1}`} value={formState[`marca${i + 1}` as keyof IForm] as string || ''} onChange={handleChange} placeholder={`Marca ${i + 1}`} variant={variant} />
            </FormGroup>
          ))
        )}

        {fieldConfig.showMontoOriginal && (
            <FormGroup>
                <Label htmlFor="montoOriginal">Monto Total (S/)</Label>
                <StyledInput id="montoOriginal" name="montoOriginal" type="number" required value={formState.montoOriginal || ''} onChange={handleChange} variant={variant} max={1000000} step={0.01} className="input-qty w-32" />
            </FormGroup>
        )}



        {fieldConfig.showCargarRespaldo && (
            <div className="lg:col-span-3 flex justify-end items-center mt-2">
                <button type="button" onClick={onOpenBackupModal} title="Cargar un estado guardado previamente" className={`btn btn-module-${variant}`}>
                    Cargar Respaldo
                </button>
            </div>
        )}
      </div>
    </div>
  );
};