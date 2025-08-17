import React from 'react';
import { StyledInput } from '../ui/StyledInput';
import { StyledSelect } from '../ui/StyledSelect';
import { FormGroup, Label } from '../ui/FormControls';
import { RucDniInput } from '../RucDniInput';
import { SucursalInput } from '../ui/SucursalInput';
import type { IForm } from '../../interfaces';

interface Props {
  formState: IForm; // Pass the whole form state for simplicity
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRucDniChange: (type: 'ruc' | 'dni', number: string, social: string) => void;
  onRazonSocialManualChange: (social: string) => void;
  rucEstado: string | null;
  rucCondicion: string | null;
  isLoadingRuc: boolean;
  rucError: string | null;
  onOpenBackupModal: () => void; // New prop
}

export const DatosGeneralesPlanner: React.FC<Props> = ({
  formState,
  onFormChange,
  onRucDniChange,
  onRazonSocialManualChange,
  rucEstado,
  rucCondicion,
  isLoadingRuc,
  rucError,
  onOpenBackupModal
}) => {
  return (
    <section id="datos-cliente" className="card">
      <h2 className="form-section-title title-planificador">1. Datos Generales</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={(e) => e.preventDefault()}>

        <RucDniInput
            documentType={formState.documentType || 'ruc'}
            documentNumber={formState.documento_cliente || ''}
            razonSocial={formState.cliente || ''}
            onDocumentChange={onRucDniChange}
            onRazonSocialChange={onRazonSocialManualChange}
            rucEstado={rucEstado}
            rucCondicion={rucCondicion}
            isLoading={isLoadingRuc}
            error={rucError}
            variant="planificador"
        />

        <FormGroup>
            <Label htmlFor="codigo_cliente">Código de Cliente</Label>
            <StyledInput
                type="text"
                id="codigo_cliente"
                name="codigo_cliente"
                value={formState.codigo_cliente || ''}
                onChange={onFormChange}
                placeholder="Opcional"
                variant="planificador"
            />
        </FormGroup>

        <SucursalInput
            value={formState.sucursal || ''}
            onChange={onFormChange}
            variant="planificador"
        />

        <FormGroup>
            <Label htmlFor="montoOriginal">Monto Total (S/)</Label>
            <StyledInput
                id="montoOriginal"
                name="montoOriginal"
                type="number"
                step="0.01"
                min="0"
                required
                value={formState.montoOriginal || ''}
                onChange={onFormChange}
                variant="planificador"
            />
        </FormGroup>

        <FormGroup>
            <Label htmlFor="pedido_planificador">Pedido</Label>
            <StyledInput
                type="text"
                id="pedido_planificador"
                name="pedido_planificador"
                value={formState.pedido_planificador || ''}
                onChange={onFormChange}
                placeholder="Ej: Pedido de campaña"
                variant="planificador"
            />
        </FormGroup>

        <FormGroup>
            <Label htmlFor="linea_planificador_color">Línea para Reporte</Label>
            <StyledSelect
                id="linea_planificador_color"
                name="linea_planificador_color"
                value={formState.linea_planificador_color || ''}
                onChange={onFormChange}
                variant="planificador"
            >
                <option value="">Seleccionar color...</option>
                <option value="rojo">Viniball (Rojo)</option>
                <option value="azul">Vinifan (Azul)</option>
                <option value="verde">Otros (Verde)</option>
            </StyledSelect>
        </FormGroup>

        <div className="lg:col-span-3 flex justify-end gap-4">
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="bg-planificador-light-primary dark:bg-planificador-dark-primary text-white py-2 px-4 rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-planificador-light-primary dark:focus:ring-planificador-dark-primary"
            title="Cargar un estado guardado previamente"
          >
            Cargar Respaldo
          </button>
        </div>
      </form>
    </section>
  );
};