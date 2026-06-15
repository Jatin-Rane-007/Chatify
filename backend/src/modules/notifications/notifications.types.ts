import { z } from 'zod';

export const PlatformSchema = z.enum(['IOS', 'ANDROID', 'WEB']);
export type PlatformDto = z.infer<typeof PlatformSchema>;

export const RegisterDeviceSchema = z
  .object({
    platform: PlatformSchema,
    token: z.string().min(1).max(512),
    endpoint: z.string().url().max(1024).optional(),
    p256dh: z.string().min(1).max(512).optional(),
    auth: z.string().min(1).max(512).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.platform === 'WEB') {
      if (!val.endpoint || !val.p256dh || !val.auth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WEB platform requires endpoint, p256dh, and auth',
        });
      }
    }
  });
export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;

export interface ChatMessageNotificationInput {
  chatId: string;
  messageId: string;
  senderId: string;
  senderDisplayName: string;
  chatName: string;
  preview: string;
  recipientUserIds: string[];
}
