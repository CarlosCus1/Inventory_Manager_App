import React, { useState, useRef } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { ModuleTextField } from './ui/ModuleTextField';
import { ModuleButton } from './ui/ModuleButton';
import { type InputProps } from './ui/StyledInput'; // Keep for compatibility

// Extending InputProps to get variant type
type VariantProp = InputProps['variant'];
type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';

interface RucDniInputProps {
  documentType: 'ruc' | 'dni';
  documentNumber: string;
  razonSocial: string;
  rucEstado?: string | null;
  rucCondicion?: string | null;
  isLoading?: boolean;
  onDocumentChange: (type: 'ruc' | 'dni', number: string, razonSocial: string) => void;
  onRazonSocialChange: (social: string) => void;
  variant?: VariantProp; // Use the same variant prop as StyledInput
  error?: string | null; // Add this line
}

export const RucDniInput: React.FC<RucDniInputProps> = ({
  documentType,
  documentNumber,
  razonSocial,
  rucEstado,
  rucCondicion,
  isLoading = false,
  onDocumentChange,
  onRazonSocialChange,
  variant = 'default'
}) => {
  const [showDocError, setShowDocError] = useState(false);
  const errorTimeout = useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
    };
  }, []);

  const handleTypeChange = (type: 'ruc' | 'dni') => {
    onDocumentChange(type, '', '');
    setShowDocError(false);
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/\D/g, '');
    onDocumentChange(documentType, sanitizedValue, razonSocial);
    setShowDocError(false);
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
  };

  const handleNumberBlur = () => {
    let isInvalid = false;
    if (documentType === 'dni' && documentNumber.length > 0 && documentNumber.length !== 8) {
      isInvalid = true;
    }
    if (documentType === 'ruc' && documentNumber.length > 0 && documentNumber.length !== 11) {
      isInvalid = true;
    }

    // Set showDocError based on validation result
    setShowDocError(isInvalid);

    // Remove the timeout as the user wants the message to persist until corrected
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    errorTimeout.current = null; // Clear the ref
  };

  const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRazonSocialChange(e.target.value);
  };

  const inputPlaceholder = documentType === 'ruc' ? 'Ingrese RUC (11 dígitos)' : 'Ingrese DNI';
  const inputMaxLength = documentType === 'ruc' ? 11 : 8;

  const moduleVariant = variant as ModuleVariant;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <ModuleButton
          module={moduleVariant}
          variant={documentType === 'ruc' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeChange('ruc')}
        >
          RUC
        </ModuleButton>
        <ModuleButton
          module={moduleVariant}
          variant={documentType === 'dni' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleTypeChange('dni')}
        >
          DNI
        </ModuleButton>
      </Stack>


      <ModuleTextField
        module={moduleVariant}
        label="Número de Documento"
        placeholder={inputPlaceholder}
        value={documentNumber}
        onChange={handleNumberChange}
        onBlur={handleNumberBlur}
        inputProps={{ maxLength: inputMaxLength }}
        disabled={isLoading}
        fullWidth
      />

      {showDocError && (
        <Typography
          variant="caption"
          sx={{
            bgcolor: 'error.main',
            color: 'error.contrastText',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'inline-block',
            mt: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {documentType === 'ruc'
            ? 'El RUC debe tener 11 dígitos.'
            : 'El DNI debe tener 8 dígitos.'}
        </Typography>
      )}
      
      {isLoading && (
        <Typography variant="body2" color="info.main">
          Buscando...
        </Typography>
      )}

      <ModuleTextField
        module={moduleVariant}
        label="Razón Social / Nombre"
        placeholder="Razón Social o Nombre"
        value={razonSocial}
        onChange={handleRazonSocialChange}
        InputProps={{ readOnly: documentType === 'ruc' && isLoading }}
        fullWidth
      />
      
      {documentType === 'ruc' && rucEstado && rucCondicion && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            Estado: 
            <Typography 
              component="span" 
              sx={{ 
                fontWeight: 'bold', 
                color: rucEstado.toLowerCase().includes('activo') ? 'success.main' : 'error.main',
                ml: 0.5
              }}
            >
              {rucEstado}
            </Typography>
          </Typography>
          <Typography variant="body2" component="div">
            Condición: 
            <Typography 
              component="span" 
              sx={{ 
                fontWeight: 'bold', 
                color: rucCondicion.toLowerCase().includes('habido') ? 'success.main' : 'error.main',
                ml: 0.5
              }}
            >
              {rucCondicion}
            </Typography>
          </Typography>
        </Box>
      )}
    </Box>
  );
};