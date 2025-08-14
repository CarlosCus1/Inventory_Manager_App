import React from 'react';
import { StyledInput } from '../ui/StyledInput';
import { FormGroup, Label } from '../ui/FormControls';

// Define a more specific type for the props
interface Props {
  montoOriginal: number;
  ruc: string;
  razonSocial: string;
  errors: Record<string, string>;
  rucError: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRucChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRazonSocialChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRucSearch: () => void;
  onCalcular: () => void;
}

export const DatosGeneralesPlanner: React.FC<Props> = ({
  montoOriginal,
  ruc,
  razonSocial,
  errors,
  rucError,
  onInputChange,
  onRucChange,
  onRazonSocialChange,
  onRucSearch,
  onCalcular
}) => {
  return (
    <section id="datos-cliente" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-planificador-light-primary dark:text-planificador-dark-primary">2. Datos del Cliente</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <FormGroup>
          <Label htmlFor="montoOriginal">Monto Total (S/)</Label>
          <StyledInput
            id="montoOriginal"
            name="montoOriginal" // Add name for handler
            type="number"
            step="0.01"
            min="0"
            required
            value={montoOriginal === 0 ? '' : String(montoOriginal)}
            onChange={onInputChange}
            variant="planificador"
          />
          {errors.montoOriginal && <p className="text-sm text-red-500 mt-1">{errors.montoOriginal}</p>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="ruc">RUC</Label>
          <StyledInput
            id="ruc"
            type="text"
            maxLength={11}
            pattern="\d{11}"
            required
            value={ruc}
            onChange={onRucChange}
            onBlur={onRucSearch}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            variant="planificador"
          />
           {(errors.ruc || rucError) && <p className="text-sm text-red-500 mt-1">{errors.ruc || rucError}</p>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="descCliente">Razón Social</Label>
          <StyledInput
            id="descCliente"
            name="descCliente" // Add name for handler
            type="text"
            required
            value={razonSocial}
            onChange={onRazonSocialChange}
            variant="planificador"
          />
           {errors.descCliente && <p className="text-sm text-red-500 mt-1">{errors.descCliente}</p>}
        </FormGroup>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCalcular}
            className="bg-planificador-light-primary hover:bg-planificador-dark-secondary text-white font-bold py-2 px-4 rounded-lg"
          >
            Calcular
          </button>
        </div>
      </form>
    </section>
  );
};
