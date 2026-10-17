import { create } from 'zustand';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

// Load token from localStorage on initialization
let validToken = localStorage.getItem('token');
let validRefreshToken = localStorage.getItem('refresh_token');
let initialUser = null;

if (validToken) {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch (e) {
      initialUser = null;
    }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: validToken,
  refreshToken: validRefreshToken,
  user: initialUser,
  isAuthenticated: !!validToken,
  setAuth: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true });
  },
  updateTokens: (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refresh_token', refreshToken);
    set({ token, refreshToken });
  },
  logout: () => {
    const rf = localStorage.getItem('refresh_token');
    if (rf) {
      axios.post('/api/v1/auth/logout', { refresh_token: rf }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
