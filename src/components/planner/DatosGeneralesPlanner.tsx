import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { ModuleTextField } from '../ui/ModuleTextField';
import { ModuleSelect } from '../ui/ModuleSelect';
import { ModuleButton } from '../ui/ModuleButton';
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
  const selectOptions = [
    { value: '', label: 'Seleccionar color...', disabled: true },
    { value: 'rojo', label: 'Viniball (Rojo)' },
    { value: 'azul', label: 'Vinifan (Azul)' },
    { value: 'verde', label: 'Otros (Verde)' }
  ];

  return (
    <Box
      component="section"
      id="datos-cliente"
      sx={{
        // Padding and styling are handled by the parent CollapsiblePanel's section-card
      }}
    >
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 3, 
          fontWeight: 'bold',
          color: 'info.main',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            bottom: '-6px',
            width: '100%',
            height: '4px',
            backgroundColor: 'info.main',
          }
        }}
      >
        1. Datos Generales
      </Typography>
      
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 3
        }}
      >
        <Box sx={{ gridColumn: { lg: 'span 3' } }}>
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
        </Box>

        <ModuleTextField
          module="planificador"
          label="Código de Cliente"
          name="codigo_cliente"
          value={formState.codigo_cliente || ''}
          onChange={onFormChange}
          placeholder="Opcional"
          fullWidth
        />

        <Box>
          <SucursalInput
            value={formState.sucursal || ''}
            onChange={onFormChange}
            variant="planificador"
          />
        </Box>

        <ModuleTextField
          module="planificador"
          label="Monto Total (S/)"
          name="montoOriginal"
          type="number"
          inputProps={{ step: '0.01', min: '0' }}
          required
          value={formState.montoOriginal || ''}
          onChange={onFormChange}
          fullWidth
        />

        <ModuleTextField
          module="planificador"
          label="Pedido"
          name="pedido_planificador"
          value={formState.pedido_planificador || ''}
          onChange={onFormChange}
          placeholder="Ej: Pedido de campaña"
          fullWidth
        />

        <ModuleSelect
          module="planificador"
          label="Línea para Reporte"
          name="linea_planificador_color"
          value={formState.linea_planificador_color || ''}
          onChange={onFormChange}
          options={selectOptions}
          fullWidth
        />

        <Stack 
          direction="row" 
          justifyContent="flex-end" 
          spacing={2}
          sx={{ gridColumn: { lg: 'span 3' }, mt: 2 }}
        >
          <ModuleButton
            module="planificador"
            variant="contained"
            onClick={onOpenBackupModal}
            title="Cargar un estado guardado previamente"
          >
            Cargar Respaldo
          </ModuleButton>
        </Stack>
      </Box>
    </Box>
  );
};