import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NsrCode, NeoSeniorUserId, PreferredLang } from '../services/types';
import { saveTokens, loadTokens, clearTokens, StoredTokens } from '../services/tokenStorage';

export type UserRole = 'neo_senior' | 'neo_care';

const USER_KEY = 'neovot.user';

export interface AuthUser {
  /** Backend user UUID. For a NeoSenior this is the data-endpoint path param. */
  id: NeoSeniorUserId;
  role: UserRole;
  displayName: string;
  language: PreferredLang;
  /** NeoCare only. */
  email?: string;
  /** NeoSenior only. */
  phone?: string;
  /** NeoSenior only — their shareable NSR code (for linking/onboarding). */
  neoSeniorId?: NsrCode;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  idToken: string | null;
  refreshToken: string | null;
  /**
   * Set while a freshly-signed-up user is still completing onboarding. The
   * token exists (onboarding endpoints are auth-gated) but RootNavigator shows
   * the onboarding stack, not the app, until it clears.
   */
  pendingOnboarding: UserRole | null;
  /** For a NeoSenior mid-onboarding: which screen the stack should start on. */
  seniorOnboardingStep: 'pending_link' | 'needs_activation' | null;

  /** Returning / fully-set-up user → straight into the app. */
  signIn: (user: AuthUser, tokens: StoredTokens) => Promise<void>;
  /** New / not-yet-set-up user → authenticated but routed through onboarding first. */
  beginOnboarding: (
    user: AuthUser,
    tokens: StoredTokens,
    seniorStep?: 'pending_link' | 'needs_activation',
  ) => Promise<void>;
  /** Onboarding finished → reveal the app. */
  completeOnboarding: () => void;
  /** Update tokens in memory after a refresh (persistence handled by caller). */
  setTokens: (tokens: StoredTokens) => void;
  /** Patch the in-memory user (e.g. attach the NSR code after self-register). */
  setUser: (user: AuthUser | null) => void;
  /** Restore a persisted session on cold start. */
  hydrate: () => Promise<void>;
  logout: () => void;
}

async function persist(user: AuthUser, tokens: StoredTokens): Promise<void> {
  await saveTokens(tokens);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  idToken: null,
  refreshToken: null,
  pendingOnboarding: null,
  seniorOnboardingStep: null,

  signIn: async (user, tokens) => {
    set({
      user,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      pendingOnboarding: null,
      seniorOnboardingStep: null,
      isLoading: false,
    });
    await persist(user, tokens);
  },

  beginOnboarding: async (user, tokens, seniorStep) => {
    set({
      seniorOnboardingStep: seniorStep ?? null,
      user,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      pendingOnboarding: user.role,
      isLoading: false,
    });
    await persist(user, tokens);
  },

  completeOnboarding: () => set({ pendingOnboarding: null, seniorOnboardingStep: null }),

  setTokens: ({ idToken, refreshToken }) => set({ idToken, refreshToken }),

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });
    if (user) void AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  hydrate: async () => {
    const [tokens, rawUser] = await Promise.all([
      loadTokens(),
      AsyncStorage.getItem(USER_KEY),
    ]);
    if (tokens && rawUser) {
      set({
        user: JSON.parse(rawUser) as AuthUser,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        // A session killed mid-onboarding resumes into the app.
        pendingOnboarding: null,
        seniorOnboardingStep: null,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({
      user: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
      pendingOnboarding: null,
      seniorOnboardingStep: null,
      isLoading: false,
    });
    void clearTokens();
    void AsyncStorage.removeItem(USER_KEY);
  },
}));
