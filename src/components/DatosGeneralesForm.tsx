// --------------------------------------------------------------------------- #
//                                                                             #
//           src/components/DatosGeneralesForm.tsx (Universal)                 #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useEffect, useState } from 'react';
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
export const DatosGeneralesForm = React.forwardRef<{ getGeneralData: () => Record<string, string | number | boolean> }, Props>(({ tipo, fieldConfig, onOpenBackupModal }, ref) => {
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

  // Estado para tooltips de marcas duplicadas
  const [marcaTooltips, setMarcaTooltips] = useState<{ [key: string]: string }>({});

  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Lógica de validación (se puede expandir)
    let rules: ValidationRule[] = [];
    if (name === 'fecha') {
      rules = [{ type: 'required', message: 'La fecha es obligatoria.' }, { type: 'isValidDate', message: 'La fecha no es válida.' }];
    } else if (name === 'codigo_cliente') {
      rules = [{ type: 'isNumeric', message: 'El código de cliente debe ser numérico.' }];
    }

    const { isValid, errorMessage } = validate(value, rules);
    if (!isValid) {
      addToast(errorMessage!, 'error');
    }

    actualizarFormulario(tipo, name as keyof IForm, value);
    };
 
    // Función para manejar cambios en inputs de marca (limpia tooltips)
    const handleMarcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e);
      // Limpiar tooltips cuando se cambia cualquier marca
      setMarcaTooltips({});
    };
 
    // Función para manejar pérdida de foco en inputs de marca
    const handleMarcaBlur = () => {
      if (!fieldConfig.showMarcas) return;
 
      const marcas: string[] = [];
      const duplicados: { [key: string]: number } = {};
 
      // Recopilar todas las marcas
      for (let i = 1; i <= 5; i++) {
        const marca = formState[`marca${i}` as keyof IForm] as string;
        if (marca && marca.trim()) {
          marcas.push(marca.trim());
        }
      }
 
      // Detectar duplicados
      const newTooltips: { [key: string]: string } = {};
      const seen = new Set<string>();
 
      for (let i = 1; i <= 5; i++) {
        const marca = formState[`marca${i}` as keyof IForm] as string;
        if (marca && marca.trim()) {
          const marcaTrim = marca.trim();
          if (seen.has(marcaTrim)) {
            // Es un duplicado
            duplicados[marcaTrim] = (duplicados[marcaTrim] || 1) + 1;
            newTooltips[`marca${i}`] = `Esta marca se duplicará como "${marcaTrim}${duplicados[marcaTrim]}" para comparación entre sucursales.`;
          } else {
            seen.add(marcaTrim);
          }
        }
      }
 
      setMarcaTooltips(newTooltips);
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



  // --- F. Función para obtener datos generales ---
  const getGeneralData = (): Record<string, string | number | boolean> => {
    const data: Record<string, string | number | boolean> = {};

    if (fieldConfig.showRucDni) {
      data['Cliente'] = formState.cliente || '';
      data['Documento de Cliente'] = formState.documento_cliente || '';
    }

    if (fieldConfig.showCodigoCliente) {
      data['Código de Cliente'] = formState.codigo_cliente || '';
    }

    if (fieldConfig.showSucursal) {
      data['Sucursal'] = formState.sucursal || '';
    }

    if (fieldConfig.showFecha) {
      data['Fecha'] = formState.fecha || '';
    }

    if (fieldConfig.showMotivo && tipo === 'devoluciones') {
      data['Motivo'] = (formState as IForm & { motivo?: string }).motivo || '';
    }

    if (fieldConfig.showMarcas) {
      for (let i = 1; i <= 5; i++) {
        const marcaKey = `marca${i}` as keyof IForm;
        const marcaValue = formState[marcaKey] as string;
        if (marcaValue) {
          data[`Marca ${i}`] = marcaValue;
        }
      }
    }

    if (fieldConfig.showMontoOriginal) {
      data['Monto Total (S/)'] = formState.montoOriginal || '';
    }

    return data;
  };

  // Exponer la función para que pueda ser usada desde el componente padre
  React.useImperativeHandle(ref, () => ({
    getGeneralData,
  }));

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

        

        {fieldConfig.showMotivo && tipo === 'devoluciones' && (
          <FormGroup>
            <Label htmlFor="motivo">Motivo de Devolución</Label>
            <StyledSelect id="motivo" name="motivo" value={(formState as IForm & { motivo?: 'falla_fabrica' | 'acuerdos_comerciales' }).motivo || ''} onChange={(e) => setMotivoDevolucion(e.target.value as 'falla_fabrica' | 'acuerdos_comerciales')} variant={variant} required>
              {motivoOptions.map((option, index) => <option key={option.value} value={option.value} disabled={index === 0}>{option.label}</option>)}
            </StyledSelect>
          </FormGroup>
        )}

        {fieldConfig.showMarcas && (
          Array.from({ length: 5 }).map((_, i) => {
            const marcaKey = `marca${i + 1}`;
            const hasTooltip = marcaTooltips[marcaKey];

            return (
              <FormGroup key={i}>
                <Label htmlFor={marcaKey}>{`Marca ${i + 1}`}</Label>
                <div className="relative">
                  <StyledInput
                    type="text"
                    id={marcaKey}
                    name={marcaKey}
                    value={formState[marcaKey as keyof IForm] as string || ''}
                    onChange={handleMarcaChange}
                    onBlur={handleMarcaBlur}
                    placeholder={`Marca ${i + 1}`}
                    variant={variant}
                  />
                  {hasTooltip && (
                    <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-10 max-w-xs">
                      {marcaTooltips[marcaKey]}
                    </div>
                  )}
                </div>
              </FormGroup>
            );
          })
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
});
