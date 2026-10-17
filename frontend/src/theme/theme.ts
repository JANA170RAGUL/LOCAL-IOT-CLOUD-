import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeType } from '../store/themeStore';

export const getAppTheme = (mode: ThemeType): Theme => {
  const isDark = mode === 'dark';
  
  const bgDefault = isDark ? '#181d26' : '#e4ebf5';
  const bgPaper = isDark ? '#181d26' : '#e4ebf5';
  const shadowDark = isDark ? '#0e1218' : '#b8c5d6';
  const shadowLight = isDark ? '#222834' : '#ffffff';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb',
      },
      secondary: {
        main: '#10b981',
      },
      background: {
        default: bgDefault,
        paper: bgPaper,
      },
      text: {
        primary: isDark ? '#f8fafc' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: '"Inter", "Manrope", system-ui, -apple-system, sans-serif',
      fontSize: 15,
      htmlFontSize: 17,
      h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
      h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
      h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 600 },
      button: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: bgPaper,
            boxShadow: `8px 8px 16px ${shadowDark}, -8px -8px 16px ${shadowLight}`,
            borderRadius: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '0.875rem',
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: `5px 5px 12px ${shadowDark}, -5px -5px 12px ${shadowLight}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: `7px 7px 16px ${shadowDark}, -7px -7px 16px ${shadowLight}`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              boxShadow: `inset 4px 4px 8px ${shadowDark}, inset -4px -4px 8px ${shadowLight}`,
              transform: 'translateY(0)',
            },
          },
          contained: {
            background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
            color: '#ffffff',
            boxShadow: '6px 6px 14px rgba(37, 99, 235, 0.4), -4px -4px 10px rgba(255, 255, 255, 0.5)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: bgPaper,
            boxShadow: `8px 8px 16px ${shadowDark}, -8px -8px 16px ${shadowLight}`,
            borderRadius: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: bgPaper,
            boxShadow: `0 4px 12px ${shadowDark}`,
            borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
          },
        },
      },
    },
  });
};
