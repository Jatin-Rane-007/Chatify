'use client';

import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

/** Where an upload lands — maps to a server-controlled Cloudinary folder. */
export type UploadType = 'avatar' | 'message';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_PREFIX = 'image/';

interface SignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

/** Cheap client-side guard so we don't ask Cloudinary to reject obvious junk. */
export function validateImage(file: File): string | null {
  if (!file.type.startsWith(ACCEPTED_PREFIX)) return 'Please choose an image file.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image is too large (max 10 MB).';
  return null;
}

/**
 * Uploads a single image straight to Cloudinary using a backend-issued signature,
 * reporting progress along the way. Returns the hosted `secure_url`.
 *
 * The API secret never touches the browser — the backend only hands back a
 * short-lived signature scoped to a fixed folder.
 */
export async function uploadImage(
  file: File,
  type: UploadType,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const validationError = validateImage(file);
  if (validationError) throw new UploadError(validationError);

  const res = await api.post<SignaturePayload>(endpoints.media.signature, { type });
  if (!res.success) {
    throw new UploadError(res.message ?? 'Could not start the upload.');
  }
  const { cloudName, apiKey, timestamp, folder, signature } = res.data;

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (body.secure_url) resolve(body.secure_url);
          else reject(new UploadError('Upload succeeded but no URL was returned.'));
        } catch {
          reject(new UploadError('Unexpected response from the image host.'));
        }
      } else {
        reject(new UploadError('The image host rejected the upload.'));
      }
    };

    xhr.onerror = () => reject(new UploadError('Network error during upload.'));
    xhr.send(form);
  });
}
