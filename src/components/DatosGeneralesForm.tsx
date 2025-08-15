
// --------------------------------------------------------------------------- #
//                                                                             #
//                   src/components/DatosGeneralesForm.tsx                     #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

import { FormGroup, Label } from './ui/FormControls';
import { StyledInput } from './ui/StyledInput';
import { RucDniInput } from './RucDniInput';
import { SucursalInput } from './ui/SucursalInput';
import { FormGroup, Label, Input, FormError } from './ui/FormControls';
import { DevolucionesPedidoFields } from './form-fields/DevolucionesPedidoFields';
import { InventarioFields } from '../components/form-fields/InventarioFields';
import { PreciosFields } from '../components/form-fields/PreciosFields';

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


  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let valorFinal = value;

    // Validaciones específicas
    if (name === 'documento_cliente' || name === 'ruc') {
      // Solo permitir números.
      const valorNumerico = value.replace(/[^0-9]/g, '');
      valorFinal = valorNumerico;

      // Para documento_cliente (DNI/RUC) y ruc (inventario): mostrar error si no es 8 u 11 (documento) o 11 (ruc) cuando hay contenido
      if (name === 'documento_cliente') {
        if (valorNumerico.length > 0 && ![8, 11].includes(valorNumerico.length)) {
          setErrorDocumento('Debe tener 8 (DNI) u 11 (RUC) dígitos.');
        } else {
          setErrorDocumento(null);
        }
      }
      if (name === 'ruc') {
        if (valorNumerico.length > 0 && valorNumerico.length !== 11) {
          setErrorDocumento('El RUC debe tener 11 dígitos.');
        } else {
          setErrorDocumento(null);
        }
      }
    }

    // Se actualiza el estado global en Zustand.
    actualizarFormulario(tipo, name as keyof IForm, valorFinal);
  };

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

  // --- F. Lógica de Estilos Dinámicos ---
  // Mapeo de 'tipo' a la clase CSS del módulo para mantener la consistencia visual.
  // Esto asegura que todos los inputs dentro del mismo formulario tengan el mismo color de foco.
  const moduleInputClasses: Record<Props['tipo'], string> = {
    devoluciones: 'input-module-devoluciones',
    pedido: 'input-module-pedido',
    inventario: 'input-module-inventario',
    precios: 'input-module-comparador', // 'precios' usa el estilo del módulo comparador.
  };



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

      {['devoluciones', 'pedido'].includes(tipo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup>
            <Label htmlFor="documento_cliente" className="form-label">RUC o DNI</Label>
            <Input
              type="text"
              inputMode="numeric"
              id="documento_cliente"
              name="documento_cliente"
              value={formState.documento_cliente || ''}
              onChange={handleChange}
              placeholder="DNI o RUC"
              className={`input ${baseInputClass} ${errorDocumento ? 'input-error' : ''}`}
            />
            {errorDocumento && <FormError>{errorDocumento}</FormError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="cliente" className="form-label">Cliente</Label>
            <Input
              type="text"
              id="cliente"
              name="cliente"
              value={formState.cliente || ''}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="codigo_cliente" className="form-label">Código de Cliente</Label>
            <Input
              type="text"
              id="codigo_cliente"
              name="codigo_cliente"
              value={formState.codigo_cliente || ''}
              onChange={handleChange}
              placeholder="Código de Cliente"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          {/* Motivo de Devolución (solo cuando tipo = devoluciones) */}
          {tipo === 'devoluciones' && (
            <FormGroup>
              <Label htmlFor="motivo" className="form-label">Motivo de Devolución</Label>
              <select
                id="motivo"
                name="motivo"
                value={(formState as Record<string, string>)?.motivo ?? ''}
                onChange={(e) => {
                  const setMotivo = (useAppStore.getState() as { setMotivoDevolucion?: (m: 'falla_fabrica' | 'acuerdos_comerciales') => void }).setMotivoDevolucion;
                  if (setMotivo) {
                    setMotivo(e.target.value as 'falla_fabrica' | 'acuerdos_comerciales');
                  } else {
                    actualizarFormulario('devoluciones', 'motivo' as keyof IForm, e.target.value);
                  }
                }}
                className={`input ${baseInputClass}`}
                aria-label="Motivo de devolución"
              >
                <option value="">Seleccionar motivo...</option>
                <option value="falla_fabrica">Falla de fábrica</option>
                <option value="acuerdos_comerciales">Acuerdos comerciales</option>
              </select>
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="fecha" className="form-label">Fecha</Label>
            <Input
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleChange}
              className={`input ${baseInputClass}`}
            />
          </FormGroup>
        </div>
      )}

      {tipo === 'inventario' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup>
            <Label htmlFor="documento_cliente" className="form-label">RUC o DNI</Label>
            <Input
              type="text"
              inputMode="numeric"
              id="documento_cliente"
              name="documento_cliente"
              value={formState.documento_cliente || ''}
              onChange={handleChange}
              placeholder="DNI o RUC"
              className={`input ${baseInputClass} ${errorDocumento ? 'input-error' : ''}`}
            />
            {errorDocumento && <FormError>{errorDocumento}</FormError>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="cliente" className="form-label">Cliente</Label>
            <Input
              type="text"
              id="cliente"
              name="cliente"
              value={formState.cliente || ''}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="colaborador" className="form-label">Colaborador / Personal</Label>
            <Input
              type="text"
              id="colaborador"
              name="colaborador"
              value={(formState as Record<string, string>)?.colaborador || ''}
              onChange={handleChange}
              placeholder="Nombre del colaborador"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="fecha" className="form-label">Fecha</Label>
            <Input
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleChange}
              className={`input ${baseInputClass}`}
            />
          </FormGroup>
        </div>
      )}

      {tipo === 'precios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormGroup>
            <Label htmlFor="colaborador" className="form-label">Colaborador / Personal</Label>
            <Input
              type="text"
              id="colaborador"
              name="colaborador"
              value={(formState as Record<string, string>)?.colaborador || ''}
              onChange={handleChange}
              placeholder="Nombre del colaborador"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca1" className="form-label">Marca 1</Label>
            <Input
              type="text"
              id="marca1"
              name="marca1"
              value={(formState as Record<string, string>)?.marca1 || ''}
              onChange={handleChange}
              placeholder="Marca 1"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca2" className="form-label">Marca 2</Label>
            <Input
              type="text"
              id="marca2"
              name="marca2"
              value={(formState as Record<string, string>)?.marca2 || ''}
              onChange={handleChange}
              placeholder="Marca 2"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca3" className="form-label">Marca 3</Label>
            <Input
              type="text"
              id="marca3"
              name="marca3"
              value={(formState as Record<string, string>)?.marca3 || ''}
              onChange={handleChange}
              placeholder="Marca 3"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca4" className="form-label">Marca 4</Label>
            <Input
              type="text"
              id="marca4"
              name="marca4"
              value={(formState as Record<string, string>)?.marca4 || ''}
              onChange={handleChange}
              placeholder="Marca 4"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="marca5" className="form-label">Marca 5</Label>
            <Input
              type="text"
              id="marca5"
              name="marca5"
              value={(formState as Record<string, string>)?.marca5 || ''}
              onChange={handleChange}
              placeholder="Marca 5"
              className={`input ${baseInputClass}`}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="fecha" className="form-label">Fecha</Label>
            <Input
              type="date"
              id="fecha"
              name="fecha"
              value={formState.fecha || ''}
              onChange={handleChange}
              className={`input ${baseInputClass}`}
            />
          </FormGroup>
        </div>
      )}

        {/* --- Campos Específicos del Módulo (Inyectados) --- */}
        {children}
      </div>
    </div>
  );
};
