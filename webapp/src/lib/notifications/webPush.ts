import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export interface EnableResult {
  ok: boolean;
  reason?: 'unsupported' | 'denied' | 'no-vapid' | 'error';
}

/**
 * Asks for permission, registers the service worker, subscribes via the
 * browser push manager, and posts the subscription to the backend.
 * Idempotent: re-running returns the existing subscription.
 */
export async function enableWebPush(): Promise<EnableResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  if (!PUBLIC_KEY) return { ok: false, reason: 'no-vapid' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) as BufferSource,
      });
    }

    const json = sub.toJSON();
    await api.post(endpoints.notifications.devices, {
      platform: 'WEB',
      token: sub.endpoint,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function disableWebPush(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await api.del(endpoints.notifications.device(sub.endpoint)).catch(() => undefined);
    await sub.unsubscribe();
  } catch {
    /* swallow */
  }
}

export async function getWebPushState(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
