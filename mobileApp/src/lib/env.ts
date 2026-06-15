import { z } from 'zod';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envSchema = z.object({
  API_URL: z.string().url(),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  EXPO_PROJECT_ID: z.string().optional(),
});

const extra = Constants.expoConfig?.extra ?? {};

function defaultApiUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

const resolvedConfig = {
  API_URL: extra.API_URL || process.env.EXPO_PUBLIC_API_URL || defaultApiUrl(),
  APP_ENV: extra.APP_ENV || 'development',
  EXPO_PROJECT_ID:
    extra.EXPO_PROJECT_ID ||
    extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    undefined,
};

export const env = envSchema.parse(resolvedConfig);
