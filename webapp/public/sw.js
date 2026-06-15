/* Chatify push service worker. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (_) {
    payload = { title: 'Chatify', body: event.data.text() };
  }

  const { title = 'Chatify', body = '', data = {} } = payload;
  const chatId = data && data.chatId ? data.chatId : null;

  event.waitUntil(
    (async () => {
      // If a visible, focused window already shows the chat, defer to the
      // in-app UI (post a message). Otherwise, show the OS banner.
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const visible = clients.some((c) => c.visibilityState === 'visible' && c.focused);

      if (visible) {
        clients.forEach((c) => {
          c.postMessage({ type: 'chat_message', payload: { title, body, data } });
        });
        return;
      }

      await self.registration.showNotification(title, {
        body,
        icon: '/chatify_logo.png',
        badge: '/chatify_logo.png',
        tag: chatId ? `chat-${chatId}` : undefined,
        renotify: !!chatId,
        data,
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;
  const url = chatId ? `/?openChatId=${encodeURIComponent(chatId)}` : '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({ type: 'navigate', url });
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
