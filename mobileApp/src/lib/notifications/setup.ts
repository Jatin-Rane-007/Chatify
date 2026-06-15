/**
 * Foreground notification policy + Android channel creation.
 * Call `installNotificationSetup()` once from the root layout.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ChatFocusStore } from '@/stores/chatFocus-store';

let installed = false;

export function installNotificationSetup(): void {
  if (installed) return;
  installed = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { chatId?: string };
      const activeChatId = ChatFocusStore.get();

      if (data?.chatId && data.chatId === activeChatId) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('chat-messages', {
    name: 'Chat messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}
