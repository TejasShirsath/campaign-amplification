import { Config } from '../constants/config';
import { getAuthToken, ApiErrorResponse } from './client';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Upload an image file from the device (via expo-image-picker result)
 * Supports both base64 JSON upload and multipart/form-data fallback.
 */
export async function uploadImageFile(asset: {
  uri: string;
  base64?: string | null;
  mimeType?: string;
  fileName?: string | null;
}): Promise<UploadResult> {
  let base = (Config.API_BASE_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
  if (base.endsWith('/api/v1')) {
    base = base.slice(0, -7);
  }
  const url = `${base}/api/v1/uploads`;

  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. If base64 is available, upload directly via JSON payload (fast, cross-platform reliable)
  if (asset.base64) {
    headers['Content-Type'] = 'application/json';
    const mime = asset.mimeType || 'image/jpeg';
    const payload = asset.base64.startsWith('data:')
      ? asset.base64
      : `data:${mime};base64,${asset.base64}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: payload }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new ApiErrorResponse(
          res.status,
          json?.error?.message || 'Failed to upload image',
          json?.error?.code || 'UPLOAD_FAILED'
        );
      }
      return json.data;
    } catch (err: any) {
      if (err instanceof ApiErrorResponse) throw err;
      throw new ApiErrorResponse(500, err.message || 'Image upload failed', 'NETWORK_ERROR');
    }
  }

  // 2. Fallback to multipart FormData if base64 is not provided
  try {
    const formData = new FormData();
    const filename = asset.fileName || `image-${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';

    formData.append('file', {
      uri: asset.uri,
      name: filename,
      type,
    } as any);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new ApiErrorResponse(
        res.status,
        json?.error?.message || 'Failed to upload image',
        json?.error?.code || 'UPLOAD_FAILED'
      );
    }
    return json.data;
  } catch (err: any) {
    if (err instanceof ApiErrorResponse) throw err;
    throw new ApiErrorResponse(500, err.message || 'Image upload failed', 'NETWORK_ERROR');
  }
}
