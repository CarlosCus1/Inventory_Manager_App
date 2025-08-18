import React from 'react';
import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { type DateClickArg } from '@fullcalendar/interaction';
import { type DayCellContentArg } from '@fullcalendar/core';
import { moduleColors } from '../../theme/muiTheme';

type ModuleVariant = 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'planificador' | 'default';

interface ModuleCalendarProps {
  module: ModuleVariant;
  selectedDates?: Set<string>;
  onDateClick?: (arg: DateClickArg) => void;
  fetchCalendarEvents?: (info: { start: Date; end: Date; timeZone: string; }, successCallback: (events: []) => void, failureCallback: (error: Error) => void) => void;
}

const StyledCalendarContainer = styled(Paper)<{ module: ModuleVariant }>(({ theme, module }) => {
  const colors = module === 'default' ? theme.palette.primary : moduleColors[module as keyof typeof moduleColors];
  
  return {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    
    '& .fc': {
      fontFamily: theme.typography.fontFamily,
      
      '& .fc-toolbar-title': {
        fontSize: '1.25rem',
        fontWeight: theme.typography.fontWeightBold,
        color: theme.palette.text.primary,
      },
      
      '& .fc-button': {
        backgroundColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[300],
        color: theme.palette.text.primary,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(0.5, 1),
        fontSize: '0.875rem',
        fontWeight: theme.typography.fontWeightMedium,
        textTransform: 'none',
        boxShadow: 'none',
        
        '&:hover': {
          backgroundColor: theme.palette.grey[200],
          borderColor: theme.palette.grey[400],
        },
        
        '&:focus': {
          boxShadow: `0 0 0 2px ${colors?.main || theme.palette.primary.main}40`,
        },
        
        '&.fc-button-primary': {
          backgroundColor: colors?.main || theme.palette.primary.main,
          borderColor: colors?.main || theme.palette.primary.main,
          color: colors?.contrastText || theme.palette.primary.contrastText,
          
          '&:hover': {
            backgroundColor: colors?.dark || theme.palette.primary.dark,
            borderColor: colors?.dark || theme.palette.primary.dark,
          }
        }
      },
      
      '& .fc-col-header-cell': {
        backgroundColor: theme.palette.grey[50],
        borderColor: theme.palette.grey[200],
        
        '& .fc-col-header-cell-cushion': {
          color: theme.palette.text.secondary,
          fontWeight: theme.typography.fontWeightMedium,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          padding: theme.spacing(1),
        }
      },
      
      '& .fc-daygrid-day': {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.grey[200],
        
        '&:hover': {
          backgroundColor: theme.palette.grey[50],
        }
      },
      
      '& .fc-daygrid-day-number': {
        color: theme.palette.text.primary,
        fontSize: '0.875rem',
        fontWeight: theme.typography.fontWeightRegular,
        padding: theme.spacing(0.5),
        textDecoration: 'none',
        
        '&:hover': {
          backgroundColor: `${colors?.main || theme.palette.primary.main}20`,
          borderRadius: '50%',
        }
      },
      
      '& .fc-day-today': {
        backgroundColor: `${colors?.main || theme.palette.primary.main}08`,
        
        '& .fc-daygrid-day-number': {
          backgroundColor: colors?.main || theme.palette.primary.main,
          color: colors?.contrastText || theme.palette.primary.contrastText,
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px auto',
        }
      },
      
      '& .fc-day-selected': {
        /* The background is now handled by the ::before pseudo-element on the number */
        '& .fc-daygrid-day-number': {
          backgroundColor: colors?.main || theme.palette.primary.main,
          color: colors?.contrastText || theme.palette.primary.contrastText,
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px auto',
          fontWeight: theme.typography.fontWeightMedium,
        }
      },
      
      '& .fc-holiday': {
        backgroundColor: `${theme.palette.error.main}08`,
        
        '& .fc-daygrid-day-number': {
          color: theme.palette.error.main,
          fontWeight: theme.typography.fontWeightMedium,
        }
      },
      
      '& .fc-day-sun .fc-daygrid-day-number': {
        color: theme.palette.error.main,
      },
      
      '& .fc-day-sat .fc-daygrid-day-number': {
        color: colors?.main || theme.palette.primary.main,
      },
      
      '& .fc-day-past': {
        opacity: 0.6,
        
        '& .fc-daygrid-day-number': {
          color: theme.palette.text.disabled,
        }
      },
      
      '& .fc-daygrid-day-events, & .fc-daygrid-day-bottom': {
        display: 'none !important',
      },
      
      '& .fc-daygrid-day-top': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
      }
    }
  };
});

export const ModuleCalendar: React.FC<ModuleCalendarProps> = ({
  module,
  selectedDates,
  onDateClick,
  fetchCalendarEvents
}) => {
  const dayCellClassNames = (arg: DayCellContentArg) => {
    const classNames = [];
    const dateStr = `${String(arg.date.getDate()).padStart(2, '0')}/${String(arg.date.getMonth() + 1).padStart(2, '0')}/${arg.date.getFullYear()}`;
    if (selectedDates?.has(dateStr)) {
      classNames.push('fc-day-selected');
    }
    return classNames;
  };

  return (
    <StyledCalendarContainer module={module}>
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          locale="es"
          initialView="dayGridMonth"
          height="auto"
          fixedWeekCount={true}
          headerToolbar={{
            left: 'prev,today,next',
            center: 'title',
            right: ''
          }}
          buttonText={{
            today: 'Hoy'
          }}
          eventSources={fetchCalendarEvents ? [{ events: fetchCalendarEvents }] : []}
          dateClick={onDateClick}
          dayCellClassNames={dayCellClassNames}
          eventContent={(arg) => {
            if (!arg.event.title || arg.event.title.trim() === '') {
              return false;
            }
            return true;
          }}
        />
      </Box>
    </StyledCalendarContainer>
  );
};

export default ModuleCalendar;