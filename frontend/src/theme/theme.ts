import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeType } from '../store/themeStore';

export const getAppTheme = (mode: ThemeType): Theme => {
  if (mode === 'dark') {
    return createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#3b82f6',
        },
        secondary: {
          main: '#10b981',
        },
        background: {
          default: '#090d16',
          paper: '#111827',
        },
        text: {
          primary: '#f3f4f6',
          secondary: '#9ca3af',
        },
      },
      typography: {
        fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 15,
        htmlFontSize: 17,
      },
    });
  } else if (mode === 'enterprise-blue') {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#0f4c81',
        },
        secondary: {
          main: '#00b4d8',
        },
        background: {
          default: '#f0f4f8',
          paper: '#ffffff',
        },
        text: {
          primary: '#1e293b',
          secondary: '#64748b',
        },
      },
      typography: {
        fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 15,
        htmlFontSize: 17,
      },
    });
  } else {
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#2563eb',
        },
        secondary: {
          main: '#10b981',
        },
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
        },
      },
      typography: {
        fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 15,
        htmlFontSize: 17,
      },
    });
  }
};
