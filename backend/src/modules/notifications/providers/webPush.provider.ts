import webpush from 'web-push';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger.js';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_CONTACT_EMAIL) {
    return false;
  }
  webpush.setVapidDetails(
    `mailto:${env.VAPID_CONTACT_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface WebPushResult {
  ok: boolean;
  gone: boolean;
}

export async function sendWebPush(
  sub: WebPushSubscription,
  payload: object,
): Promise<WebPushResult> {
  if (!ensureConfigured()) {
    logger.warn('web push skipped — VAPID env not configured');
    return { ok: false, gone: false };
  }

  try {
    await webpush.sendNotification(sub, JSON.stringify(payload), {
      TTL: 60 * 60 * 24,
      urgency: 'high',
    });
    return { ok: true, gone: false };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) {
      return { ok: false, gone: true };
    }
    logger.error({ err }, 'web push send failed');
    return { ok: false, gone: false };
  }
}
