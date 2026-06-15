import { DarkTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { Palette } from '@/constants/theme';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { useAuthStore } from '@/stores/auth-store';
import { SocketProvider } from '@/context/SocketContext';
import {
  installNotificationSetup,
  ensureAndroidChannel,
} from '@/lib/notifications/setup';
import { useNotificationTapHandler } from '@/lib/notifications/handlers';
import { registerForPushNotifications } from '@/lib/notifications/register';

installNotificationSetup();

export default function TabLayout() {
  const { user, loading, newlyRegistered } = useAuthStore();

  useNotificationTapHandler();

  useEffect(() => {
    void ensureAndroidChannel();
  }, []);

  useEffect(() => {
    if (user) void registerForPushNotifications();
  }, [user]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Palette.charcoal,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Palette.tangerine} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <QueryProvider>
        <SocketProvider>
          {!user ? (
            <AuthScreen />
          ) : newlyRegistered ? (
            <WelcomeScreen />
          ) : (
            <>
              <AnimatedSplashOverlay />
              <AppTabs />
            </>
          )}
        </SocketProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
