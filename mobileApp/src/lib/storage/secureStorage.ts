import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Token-grade storage abstraction.
 *
 * Native: hardware-backed Keychain/Keystore via expo-secure-store.
 * Web: sessionStorage — NOT a real secure store. Tokens are cleared on
 *   tab close, which is better than localStorage but still XSS-readable.
 *   The real fix is access-token-in-memory + refresh-token-in-httpOnly-cookie,
 *   which requires the backend to ship a refresh endpoint with cookie support.
 *   Track that under the refresh-token TODO in `lib/api/client.ts`.
 */
export const secureStorage = {
  set: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        // sessionStorage may be unavailable (SSR, privacy mode) — ignore.
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  get: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  delete: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
