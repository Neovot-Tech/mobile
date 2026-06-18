// Secure token persistence. Firebase ID tokens are short-lived; the refresh
// token is the long-lived secret, so on native both live in the OS
// keychain/keystore via expo-secure-store (works in Expo Go — no dev build).
// expo-secure-store has no web implementation, so the web QA harness falls back
// to AsyncStorage (web is dev-only here, not a production target).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ID_TOKEN_KEY = 'neovot.idToken';
const REFRESH_TOKEN_KEY = 'neovot.refreshToken';

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export interface StoredTokens {
  idToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    setItem(ID_TOKEN_KEY, tokens.idToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [idToken, refreshToken] = await Promise.all([
    getItem(ID_TOKEN_KEY),
    getItem(REFRESH_TOKEN_KEY),
  ]);
  if (!idToken || !refreshToken) return null;
  return { idToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([removeItem(ID_TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)]);
}
