import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * Upload targets map to a Cloudinary folder. Keeping the set closed server-side
 * means a client can't scatter uploads into arbitrary folders.
 */
const FOLDERS = {
  avatar: 'chatify/avatars',
  message: 'chatify/messages',
} as const;

type UploadType = keyof typeof FOLDERS;

export class MediaController {
  /**
   * Issue a short-lived signature so the browser can upload a single image
   * straight to Cloudinary without the API secret ever leaving the server.
   *
   * The client posts `file`, `api_key`, `timestamp`, `folder` and `signature`
   * to Cloudinary's upload endpoint. Only `folder` + `timestamp` are signed
   * (alphabetical), which is exactly what Cloudinary recomputes on its side.
   */
  createUploadSignature = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as any;
      if (!authReq.user?.userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const cloudName = env.CLOUDINARY_CLOUD_NAME;
      const apiKey = env.CLOUDINARY_API_KEY;
      const apiSecret = env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        throw new AppError('Media uploads are not configured.', 503, 'MEDIA_NOT_CONFIGURED');
      }

      const type = (req.body?.type as UploadType) ?? 'message';
      const folder = FOLDERS[type] ?? FOLDERS.message;

      const timestamp = Math.round(Date.now() / 1000);

      // Params to sign, alphabetical, joined as a query string, then the secret
      // is appended before hashing (Cloudinary's documented scheme).
      const toSign = `folder=${folder}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash('sha1')
        .update(toSign + apiSecret)
        .digest('hex');

      res.status(200).json({
        success: true,
        data: {
          cloudName,
          apiKey,
          timestamp,
          folder,
          signature,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
