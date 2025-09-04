import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider as CustomThemeProvider } from './hooks/useTheme'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import muiTheme from './theme/muiTheme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomThemeProvider>
      <MuiThemeProvider theme={muiTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MuiThemeProvider>
    </CustomThemeProvider>
  </StrictMode>,
)
