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
const token = localStorage.getItem('token');
let initialUser = null;
if (token) {
  try {
    const decoded: any = jwtDecode(token);
    // You could also fetch full user here, but for now we'll just parse claims if they exist
    // Actually getMe() should be called, but we will store user in localstorage for simplicity
  } catch (e) {
    localStorage.removeItem('token');
  }
}

const savedUser = localStorage.getItem('user');
if (savedUser) {
  initialUser = JSON.parse(savedUser);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: token || null,
  user: initialUser,
  isAuthenticated: !!token,
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
