import { create } from 'zustand';
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
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// Load token from localStorage on initialization
let validToken = localStorage.getItem('token');
let initialUser = null;

if (validToken) {
  try {
    const decoded: any = jwtDecode(validToken);
    if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      validToken = null;
    }
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    validToken = null;
  }
}

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
  user: initialUser,
  isAuthenticated: !!validToken,
  setAuth: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
