import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { env } from '@/lib/env';
import { secureStorage } from '@/lib/storage/secureStorage';

const TOKEN_KEY = 'expo_push_token';

/**
 * Request permission, fetch an Expo push token, and register it with the
 * backend. Safe to call multiple times — caches the last registered token
 * in SecureStore and skips the network call if unchanged.
 * Returns the token on success, or null when registration cannot proceed
 * (simulator, denied permission, missing EXPO_PROJECT_ID, network error).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    if (!env.EXPO_PROJECT_ID) return null;

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = req.status;
    }
    if (status !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: env.EXPO_PROJECT_ID,
    });
    if (!token) return null;

    const cached = await secureStorage.get(TOKEN_KEY);
    if (cached === token) return token;

    await apiClient.post(endpoints.notifications.devices, {
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      token,
    });
    await secureStorage.set(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Delete the registered token on logout. Best-effort; never throws.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await secureStorage.get(TOKEN_KEY);
    if (!token) return;
    await apiClient.delete(endpoints.notifications.device(token)).catch(() => undefined);
    await secureStorage.delete(TOKEN_KEY);
  } catch {
    /* swallow */
  }
}
