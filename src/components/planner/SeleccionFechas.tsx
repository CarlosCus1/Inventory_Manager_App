import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Stack } from '@mui/material';
import * as DateUtils from '../../utils/dateUtils';
import { ModuleCalendar } from '../ui/ModuleCalendar';
import { ModuleButton } from '../ui/ModuleButton';
import { type DateClickArg } from '@fullcalendar/interaction';
import { type DayCellMountArg } from '@fullcalendar/core';

interface Props {
  selectedDates: Set<string>;
  onCalcular: () => void;
  isCalcularDisabled: boolean;
  fetchCalendarEvents: (info: { start: Date; end: Date; timeZone: string; }, successCallback: (events: Array<{ date: string; name: string }>) => void, failureCallback: (error: Error) => void) => void;
  handleDateClick: (arg: DateClickArg) => void;
  handleDayCellMount: (arg: DayCellMountArg) => void;
  onClearSelectedDates: () => void;
}

export const SeleccionFechas: React.FC<Props> = ({
  selectedDates,
  onCalcular,
  isCalcularDisabled,
  fetchCalendarEvents,
  handleDateClick,
  onClearSelectedDates
}) => {

  const getTooltipText = () => {
    if (isCalcularDisabled) {
      return "Por favor, complete todos los campos de Datos Generales y seleccione al menos una fecha.";
    }
    return "Calcular la distribución de pagos con los datos y fechas seleccionadas";
  };

  return (
    <Box
      component="section"
      id="seleccion-fechas"
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
        2. Selección de Fechas
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <ModuleCalendar
          // module removed
          selectedDates={selectedDates}
          onDateClick={handleDateClick}
          fetchCalendarEvents={fetchCalendarEvents}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            mb: 2, 
            fontWeight: 'semibold',
            color: 'info.main'
          }}
        >
          Fechas Seleccionadas ({selectedDates.size})
        </Typography>
        
        <Box
          sx={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'info.light',
            borderRadius: 1,
            p: 1,
                        backgroundColor: 'var(--panel)' // Use theme variable for background
          }}
        >
          <List dense>
            {Array.from(selectedDates)
              .sort((a, b) => DateUtils.parsearFecha(a).getTime() - DateUtils.parsearFecha(b).getTime())
              .map(fecha => {
                const diasRestantes = DateUtils.diasDesdeHoy(fecha);
                let textoDias = '';
                switch (diasRestantes) {
                  case 0:
                    textoDias = ' (Hoy)';
                    break;
                  case 1:
                    textoDias = ' (Mañana)';
                    break;
                  case -1:
                    textoDias = ' (Ayer)';
                    break;
                  default:
                    if (diasRestantes > 1) {
                      textoDias = ` (en ${diasRestantes} días)`;
                    } else {
                      textoDias = ` (hace ${Math.abs(diasRestantes)} días)`;
                    }
                    break;
                }
                return (
                  <ListItem 
                    key={fecha}
                    sx={{ 
                      py: 0.5,
                      borderBottom: '1px solid',
                      borderColor: 'info.light',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemText 
                      primary={`${fecha}${textoDias}`}
                      sx={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Box>
      </Box>

      <Stack 
        direction="row" 
        justifyContent="flex-end" 
        spacing={2}
        sx={{ mt: 3 }}
      >
        <ModuleButton
          // module removed
          variant="outlined"
          onClick={onClearSelectedDates}
          title="Limpiar todas las fechas seleccionadas"
        >
          Limpiar Fechas
        </ModuleButton>
        
        <ModuleButton
          // module removed
          variant="contained"
          size="large"
          onClick={onCalcular}
          disabled={isCalcularDisabled}
          title={getTooltipText()}
          sx={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            px: 3,
            py: 1,
            transform: isCalcularDisabled ? 'none' : 'scale(1)',
            '&:hover': {
              transform: isCalcularDisabled ? 'none' : 'scale(1.02)',
            }
          }}
        >
          Calcular
        </ModuleButton>
      </Stack>
    </Box>
  );
};