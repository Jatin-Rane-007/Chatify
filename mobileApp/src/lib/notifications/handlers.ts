import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

/**
 * Routes the user to the relevant chat when a notification is tapped.
 * Handles both the live case (app already running) and the cold-start case
 * (app launched by tapping the notification).
 */
export function useNotificationTapHandler(): void {
  useEffect(() => {
    let cancelled = false;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (cancelled || !response) return;
        routeFrom(response);
      })
      .catch(() => undefined);

    const sub = Notifications.addNotificationResponseReceivedListener(routeFrom);

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
}

function routeFrom(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as { chatId?: string };
  if (!data?.chatId) return;
  router.push({ pathname: '/', params: { openChatId: data.chatId } });
}
