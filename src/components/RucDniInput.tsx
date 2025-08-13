// src/components/RucDniInput.tsx

import React, { useState, useEffect, useCallback } from 'react';
// Removed consultarRuc import as API call will be handled by parent

interface RucDniInputProps {
  documentType: 'ruc' | 'dni';
  documentNumber: string;
  razonSocial: string;
  rucEstado?: string | null;
  rucCondicion?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onDocumentChange: (type: 'ruc' | 'dni', number: string, razonSocial: string) => void;
  onRazonSocialChange: (social: string) => void; // New prop for manual razonSocial change
  // Add a prop for the current module's theme class
  themeClass?: string;
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
  themeClass = ''
}) => {

  const handleTypeChange = (type: 'ruc' | 'dni') => {
    onDocumentChange(type, '', ''); // Reset number and social when type changes
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/\D/g, ''); // Only digits
    onDocumentChange(documentType, sanitizedValue, razonSocial);
  };

  const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRazonSocialChange(e.target.value);
  };

  // Determine input type and placeholder based on documentType
  const inputType = documentType === 'ruc' ? 'text' : 'text';
  const inputPlaceholder = documentType === 'ruc' ? 'Ingrese RUC (11 dígitos)' : 'Ingrese DNI';
  const inputMaxLength = documentType === 'ruc' ? 11 : 8;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleTypeChange('ruc')}
          className={`btn ${documentType === 'ruc' ? themeClass : 'btn-secondary'}`}
        >
          RUC
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('dni')}
          className={`btn ${documentType === 'dni' ? themeClass : 'btn-secondary'}`}
        >
          DNI
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="documentNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Número de Documento:
        </label>
        <input
          id="documentNumber"
          type={inputType}
          placeholder={inputPlaceholder}
          value={documentNumber}
          onChange={handleNumberChange}
          maxLength={inputMaxLength}
          className={`input ${themeClass} w-full`}
          disabled={isLoading}
        />
        {isLoading && <p className="text-sm text-blue-500">Buscando...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="razonSocial" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Razón Social / Nombre:
        </label>
        <input
          id="razonSocial"
          type="text"
          placeholder="Razón Social o Nombre"
          value={razonSocial}
          onChange={handleRazonSocialChange}
          className={`input ${themeClass} w-full`}
          readOnly={documentType === 'ruc' && isLoading} // Readonly when RUC is loading
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