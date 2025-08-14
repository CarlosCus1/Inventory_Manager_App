
// --------------------------------------------------------------------------- #
//                                                                             #
//                   src/components/DatosGeneralesForm.tsx                     #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FormGroup, Label } from './ui/FormControls';
import { StyledInput } from './ui/StyledInput';
import { RucDniInput } from './RucDniInput';
import { SucursalInput } from './ui/SucursalInput';
import type { IForm } from '../interfaces';

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
  const fetchRuc = useAppStore((state) => state.fetchRuc);

  // Map 'precios' type to 'comparador' variant for styling consistency
  const variant = tipo === 'precios' ? 'comparador' : tipo;


  // New state for RUC/DNI functionality
  const [rucEstado, setRucEstado] = useState<string | null>(null);
  const [rucCondicion, setRucCondicion] = useState<string | null>(null);
  const [isLoadingRuc, setIsLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);

  // Debounced document number for RUC API calls
  const [debouncedDocumentNumber, setDebouncedDocumentNumber] = useState(formState.documento_cliente || '');

  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Se actualiza el estado global en Zustand.
    actualizarFormulario(tipo, name as keyof IForm, value);
  };

  const handleRucDniChange = useCallback((type: 'ruc' | 'dni', number: string, social: string) => {
    actualizarFormulario(tipo, 'documentType' as keyof IForm, type);
    actualizarFormulario(tipo, 'documento_cliente' as keyof IForm, number);
    actualizarFormulario(tipo, 'cliente' as keyof IForm, social);
    // Update debounced value for RUC API call
    setDebouncedDocumentNumber(number);
  }, [tipo, actualizarFormulario]);

  const handleRazonSocialManualChange = useCallback((social: string) => {
    actualizarFormulario(tipo, 'cliente' as keyof IForm, social);
  }, [tipo, actualizarFormulario]);

  // --- D. Efecto para setear la fecha actual por defecto ---
  useEffect(() => {
    // Si el campo de fecha no tiene valor, se establece la fecha de hoy.
    if (!formState.fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      actualizarFormulario(tipo, 'fecha', hoy);
    }
  }, [tipo, formState.fecha, actualizarFormulario]);

  // Effect for debouncing RUC number and calling API
  useEffect(() => {
    if (formState.documentType === 'ruc' && debouncedDocumentNumber.length === 11) {
      setIsLoadingRuc(true);
      setRucError(null);
      setRucEstado(null);
      setRucCondicion(null);

      const fetchRucData = async () => {
        try {
          const data = await fetchRuc(debouncedDocumentNumber);
          actualizarFormulario(tipo, 'cliente' as keyof IForm, data.razonSocial);
          setRucEstado(data.estado || null);
          setRucCondicion(data.condicion || null);
        } catch (err) {
          console.error("Error fetching RUC in DatosGeneralesForm:", err);
          setRucError((err as Error).message || 'Error al consultar RUC.');
          actualizarFormulario(tipo, 'cliente' as keyof IForm, ''); // Clear social on error
          setRucEstado(null);
          setRucCondicion(null);
        } finally {
          setIsLoadingRuc(false);
        }
      };
      fetchRucData();
    } else if (formState.documentType === 'ruc' && debouncedDocumentNumber.length !== 11) {
      setRucError('El RUC debe tener 11 dígitos.');
      actualizarFormulario(tipo, 'cliente' as keyof IForm, ''); // Clear social
      setRucEstado(null);
      setRucCondicion(null);
    } else {
      setRucError(null);
      setRucEstado(null);
      setRucCondicion(null);
    }
  }, [formState.documentType, debouncedDocumentNumber, tipo, actualizarFormulario, fetchRuc]); // Dependencies for RUC effect


  // --- E. Renderizado del Componente ---
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 form-section-title">Datos Generales</h2>
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
          error={rucError}
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
