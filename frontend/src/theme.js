import { createTheme } from '@mui/material';

// Material-UI Dark Theme Configuration
export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a8c7fa' },
    secondary: { main: '#c4eca8' },
    background: { default: '#000000', paper: 'rgba(20, 21, 25, 0.90)' },
  },
  shape: { borderRadius: 28 },
});
