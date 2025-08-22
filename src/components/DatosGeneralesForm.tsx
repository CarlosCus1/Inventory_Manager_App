
// --------------------------------------------------------------------------- #
//                                                                             #
//                   src/components/DatosGeneralesForm.tsx                     #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FormGroup, Label } from './ui/FormControls';
import { StyledInput } from './ui/StyledInput';
import { RucDniInput } from './RucDniInput';
import { SucursalInput } from './ui/SucursalInput';
import { useRucDni } from '../hooks/useRucDni';
import { useFormValidation } from '../hooks/useFormValidation'; // New import
import { useToast } from '../contexts/ToastContext'; // New import
import type { IForm, ValidationRule } from '../interfaces';

// --- 2. Definición de las Props del Componente ---
interface Props {
  // `tipo` determinará qué campos se renderizan en el formulario.
  tipo: 'devoluciones' | 'pedido' | 'inventario' | 'precios';
  // `children` permitirá inyectar campos específicos de cada módulo.
  children: React.ReactNode;
}

// --- 3. Definición del Componente ---
export const DatosGeneralesForm: React.FC<Props> = ({ tipo, children }) => {
  // --- A. Conexión con el Store de Zustand ---
  // Se extrae el estado del formulario para el `tipo` actual y la acción para actualizarlo.
  // Gracias a la persistencia, los datos del formulario se cargarán desde localStorage si existen.
  const formState = useAppStore((state) => state.formState[tipo]);
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);

  // Map 'precios' type to 'comparador' variant for styling consistency
  const variant = tipo === 'precios' ? 'comparador' : tipo;

  // Use the custom hook to manage RUC/DNI logic
  const {
    rucEstado,
    rucCondicion,
    isLoadingRuc,
    handleRucDniChange,
    handleRazonSocialManualChange,
  } = useRucDni(tipo);

  const { validate } = useFormValidation(); // Initialize useFormValidation
  const { addToast } = useToast(); // Initialize useToast

  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let rules: ValidationRule[] = [];
    if (name === 'fecha') {
      rules = [
        { type: 'required', message: 'La fecha es obligatoria.' },
        { type: 'isValidDate', message: 'La fecha no es válida.' }
      ];
    } else if (name === 'codigo_cliente') {
      rules = [{ type: 'isNumeric', message: 'El código de cliente debe ser numérico.' }];
    } else if (name === 'documento_cliente') {
      if (formState.documentType === 'dni') {
        rules = [{ type: 'isDni', message: 'El DNI debe tener 8 dígitos.' }];
      } else if (formState.documentType === 'ruc') {
        rules = [{ type: 'isRuc', message: 'El RUC debe tener 11 dígitos.' }];
      }
    }
    // Add rules for other fields as needed

    const { isValid, errorMessage } = validate(value, rules);

    if (!isValid) {
      addToast(errorMessage!, 'error');
      // Optionally, prevent updating the form state if invalid
      // return;
    }

    // Se actualiza el estado global en Zustand.
    actualizarFormulario(tipo, name as keyof IForm, value);
  };

  // --- D. Efecto para setear la fecha actual por defecto ---
  useEffect(() => {
    // Si el campo de fecha no tiene valor, se establece la fecha de hoy.
    if (!formState.fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      actualizarFormulario(tipo, 'fecha', hoy);
    }
  }, [tipo, formState.fecha, actualizarFormulario]);


  // --- E. Renderizado del Componente ---
  return (
    <div className="card">
      <h2 className={`text-2xl font-bold mb-4 form-section-title title-${variant}`}>
        Datos Generales
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* --- Campos Comunes --- */}
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

        <FormGroup>
          <Label htmlFor="codigo_cliente">Código de Cliente</Label>
          <StyledInput
            type="text"
            id="codigo_cliente"
            name="codigo_cliente"
            value={formState.codigo_cliente || ''}
            onChange={handleChange}
            placeholder="Opcional"
            variant={variant}
          />
        </FormGroup>

        {/* El campo Sucursal se muestra en todos los módulos según el nuevo requisito */}
        <SucursalInput
          value={formState.sucursal || ''}
          onChange={handleChange}
          variant={variant}
        />

        {/* --- Campos Específicos del Módulo (Inyectados) --- */}
        {children}
      </div>
    </div>
  );
};
