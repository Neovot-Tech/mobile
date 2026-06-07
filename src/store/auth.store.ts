import { create } from 'zustand';

export type UserRole = 'neo_senior' | 'neo_care';

export interface AuthUser {
  id: string;
  role: UserRole;
  phone: string;
  displayName: string;
  neoSeniorId?: string;
  linkedNeoSeniorId?: string;
  language: 'en' | 'tw';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null, isLoading: false }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false, isLoading: false }),
}));
