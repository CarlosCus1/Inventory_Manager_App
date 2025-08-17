import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box, Stack } from '@mui/material';
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import theme from './theme/muiTheme';
import { DatosGeneralesPlanner } from './components/planner/DatosGeneralesPlanner';
import { SeleccionFechas } from './components/planner/SeleccionFechas';
import { ModuleButton } from './components/ui/ModuleButton';
import { ModuleTextField } from './components/ui/ModuleTextField';
import { ModuleSelect } from './components/ui/ModuleSelect';
import { ModuleCalendar } from './components/ui/ModuleCalendar';
import type { IForm } from './interfaces';

const createEmotionCache = () => {
  return createCache({
    key: "mui",
    prepend: true,
  });
};

const emotionCache = createEmotionCache();

// Mock data for demonstration
const mockFormState: IForm = {
  documentType: 'ruc',
  cliente: 'Empresa Demo S.A.C.',
  documento_cliente: '20123456789',
  codigo_cliente: 'CLI001',
  sucursal: 'Lima Centro',
  montoOriginal: 15000.50,
  pedido_planificador: 'Pedido de campaña navideña',
  linea_planificador_color: 'rojo'
};

const mockSelectedDates = new Set(['2024-01-15', '2024-01-22', '2024-01-29']);

function App() {
  const [formState, setFormState] = React.useState<IForm>(mockFormState);
  const [selectedDates, setSelectedDates] = React.useState(mockSelectedDates);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'montoOriginal' ? parseFloat(value) || 0 : value
    }));
  };

  const handleRucDniChange = (type: 'ruc' | 'dni', number: string, social: string) => {
    setFormState(prev => ({
      ...prev,
      documentType: type,
      documento_cliente: number,
      cliente: social
    }));
  };

  const handleRazonSocialManualChange = (social: string) => {
    setFormState(prev => ({
      ...prev,
      cliente: social
    }));
  };

  const handleDateClick = (arg: any) => {
    const dateStr = arg.dateStr;
    const newSelectedDates = new Set(selectedDates);
    
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    
    setSelectedDates(newSelectedDates);
  };

  const handleDayCellMount = (arg: any) => {
    if (selectedDates.has(arg.date.toISOString().split('T')[0])) {
      arg.el.classList.add('fc-day-selected');
    }
  };

  const fetchCalendarEvents = (info: any, successCallback: any, failureCallback: any) => {
    // Mock calendar events
    successCallback([]);
  };

  const handleCalcular = () => {
    console.log('Calculando con datos:', formState, 'y fechas:', Array.from(selectedDates));
  };

  const handleClearSelectedDates = () => {
    setSelectedDates(new Set());
  };

  const handleOpenBackupModal = () => {
    console.log('Abriendo modal de respaldo');
  };

  const isCalcularDisabled = !formState.montoOriginal || selectedDates.size === 0;

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ 
              mb: 4,
              color: 'info.main',
              fontWeight: 'bold'
            }}
          >
            Análisis de Componentes del Planificador
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
            Componentes Corregidos y Mejorados:
          </Typography>

          {/* Datos Generales Section */}
          <DatosGeneralesPlanner
            formState={formState}
            onFormChange={handleFormChange}
            onRucDniChange={handleRucDniChange}
            onRazonSocialManualChange={handleRazonSocialManualChange}
            rucEstado="ACTIVO"
            rucCondicion="HABIDO"
            isLoadingRuc={false}
            rucError={null}
            onOpenBackupModal={handleOpenBackupModal}
          />

          {/* Selección de Fechas Section */}
          <SeleccionFechas
            selectedDates={selectedDates}
            onCalcular={handleCalcular}
            isCalcularDisabled={isCalcularDisabled}
            fetchCalendarEvents={fetchCalendarEvents}
            handleDateClick={handleDateClick}
            handleDayCellMount={handleDayCellMount}
            onClearSelectedDates={handleClearSelectedDates}
          />

          {/* Component Showcase */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'info.main', fontWeight: 'bold' }}>
              Showcase de Componentes Individuales
            </Typography>

            <Stack spacing={4}>
              {/* Buttons */}
              <Box>
                <Typography variant="h6" gutterBottom>Botones por Módulo:</Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <ModuleButton module="devoluciones" variant="contained">Devoluciones</ModuleButton>
                  <ModuleButton module="pedido" variant="contained">Pedido</ModuleButton>
                  <ModuleButton module="inventario" variant="contained">Inventario</ModuleButton>
                  <ModuleButton module="comparador" variant="contained">Comparador</ModuleButton>
                  <ModuleButton module="planificador" variant="contained">Planificador</ModuleButton>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <ModuleButton module="devoluciones" variant="outlined">Devoluciones</ModuleButton>
                  <ModuleButton module="pedido" variant="outlined">Pedido</ModuleButton>
                  <ModuleButton module="inventario" variant="outlined">Inventario</ModuleButton>
                  <ModuleButton module="comparador" variant="outlined">Comparador</ModuleButton>
                  <ModuleButton module="planificador" variant="outlined">Planificador</ModuleButton>
                </Stack>
              </Box>

              {/* Text Fields */}
              <Box>
                <Typography variant="h6" gutterBottom>Campos de Texto por Módulo:</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <ModuleTextField module="devoluciones" label="Devoluciones" placeholder="Campo de devoluciones" />
                    <ModuleTextField module="pedido" label="Pedido" placeholder="Campo de pedido" />
                    <ModuleTextField module="inventario" label="Inventario" placeholder="Campo de inventario" />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <ModuleTextField module="comparador" label="Comparador" placeholder="Campo de comparador" />
                    <ModuleTextField module="planificador" label="Planificador" placeholder="Campo de planificador" />
                  </Stack>
                </Stack>
              </Box>

              {/* Selects */}
              <Box>
                <Typography variant="h6" gutterBottom>Selectores por Módulo:</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <ModuleSelect 
                      module="devoluciones" 
                      label="Devoluciones"
                      value=""
                      options={[
                        { value: '', label: 'Seleccionar...', disabled: true },
                        { value: 'option1', label: 'Opción 1' },
                        { value: 'option2', label: 'Opción 2' }
                      ]}
                    />
                    <ModuleSelect 
                      module="pedido" 
                      label="Pedido"
                      value=""
                      options={[
                        { value: '', label: 'Seleccionar...', disabled: true },
                        { value: 'option1', label: 'Opción 1' },
                        { value: 'option2', label: 'Opción 2' }
                      ]}
                    />
                  </Stack>
                </Stack>
              </Box>

              {/* Calendar */}
              <Box>
                <Typography variant="h6" gutterBottom>Calendario del Planificador:</Typography>
                <ModuleCalendar
                  module="planificador"
                  selectedDates={selectedDates}
                  onDateClick={handleDateClick}
                  onDayCellMount={handleDayCellMount}
                  fetchCalendarEvents={fetchCalendarEvents}
                />
              </Box>
            </Stack>
          </Box>

          {/* Analysis Summary */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✅ Correcciones Implementadas:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li">Migración completa a componentes MUI con tema centralizado</Typography>
              <Typography component="li">Botones consistentes con colores por módulo y estados hover/focus</Typography>
              <Typography component="li">Campos de texto unificados con validación visual mejorada</Typography>
              <Typography component="li">Calendario con estilos coherentes y mejor UX</Typography>
              <Typography component="li">Sistema de colores centralizado y reutilizable</Typography>
              <Typography component="li">Componentes responsivos y accesibles</Typography>
              <Typography component="li">Eliminación de estilos hardcodeados y clases CSS dispersas</Typography>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;