import { create } from 'zustand';

export type ThemeType = 'light' | 'dark' | 'enterprise-blue';

interface ThemeState {
  themeMode: ThemeType;
  setThemeMode: (mode: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: (localStorage.getItem('themeMode') as ThemeType) || 'enterprise-blue',
  setThemeMode: (mode) => {
    localStorage.setItem('themeMode', mode);
    set({ themeMode: mode });
  },
}));
