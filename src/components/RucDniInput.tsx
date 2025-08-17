import React from 'react';
import { StyledInput, type InputProps } from './ui/StyledInput'; // Assuming StyledInput is in ui folder

// Extending InputProps to get variant type
type VariantProp = InputProps['variant'];

interface RucDniInputProps {
  documentType: 'ruc' | 'dni';
  documentNumber: string;
  razonSocial: string;
  rucEstado?: string | null;
  rucCondicion?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onDocumentChange: (type: 'ruc' | 'dni', number: string, razonSocial: string) => void;
  onRazonSocialChange: (social: string) => void;
  variant?: VariantProp; // Use the same variant prop as StyledInput
}

export const RucDniInput: React.FC<RucDniInputProps> = ({
  documentType,
  documentNumber,
  razonSocial,
  rucEstado,
  rucCondicion,
  isLoading = false,
  error = null,
  onDocumentChange,
  onRazonSocialChange,
  variant = 'default'
}) => {

  const handleTypeChange = (type: 'ruc' | 'dni') => {
    onDocumentChange(type, '', '');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/\D/g, '');
    onDocumentChange(documentType, sanitizedValue, razonSocial);
  };

  const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRazonSocialChange(e.target.value);
  };

  const inputPlaceholder = documentType === 'ruc' ? 'Ingrese RUC (11 dígitos)' : 'Ingrese DNI';
  const inputMaxLength = documentType === 'ruc' ? 11 : 8;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        {/* These buttons need styling that matches the variant */}

        <button type="button" onClick={() => handleTypeChange('ruc')} className={`p-2 rounded ${documentType === 'ruc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>RUC</button>
        <button type="button" onClick={() => handleTypeChange('dni')} className={`p-2 rounded ${documentType === 'dni' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>DNI</button>
        <button type="button" onClick={() => handleTypeChange('ruc')} className={`btn ${documentType === 'ruc' ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>RUC</button>
        <button type="button" onClick={() => handleTypeChange('dni')} className={`btn ${documentType === 'dni' ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>DNI</button>

      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="documentNumber" className="form-label">
          Número de Documento:
        </label>
        <StyledInput
          id="documentNumber"
          type="text"
          placeholder={inputPlaceholder}
          value={documentNumber}
          onChange={handleNumberChange}
          maxLength={inputMaxLength}
          variant={variant}
          disabled={isLoading}
        />
        {isLoading && <p className="text-sm text-sky-500">Buscando...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="razonSocial" className="form-label">
          Razón Social / Nombre:
        </label>
        <StyledInput
          id="razonSocial"
          type="text"
          placeholder="Razón Social o Nombre"
          value={razonSocial}
          onChange={handleRazonSocialChange}
          variant={variant}
          readOnly={documentType === 'ruc' && isLoading}
        />
        {documentType === 'ruc' && rucEstado && rucCondicion && (
          <div className="text-sm mt-1">
            <p>Estado: <span className={`font-semibold ${rucEstado.toLowerCase().includes('activo') ? 'text-green-600' : 'text-red-600'}`}>{rucEstado}</span></p>
            <p>Condición: <span className={`font-semibold ${rucCondicion.toLowerCase().includes('habido') ? 'text-green-600' : 'text-red-600'}`}>{rucCondicion}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};