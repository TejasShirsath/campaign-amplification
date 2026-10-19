import { Platform } from 'react-native';
import { Config } from '../constants/config';
import { getAuthToken, ApiErrorResponse } from './client';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Converts a URI (blob: or file:) to a base64 Data URL on Web
 */
async function blobUriToDataUrl(uri: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && uri) {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to convert blob URI to data URL:', e);
    }
  }
  return null;
}

/**
 * Upload an image file from the device (via expo-image-picker result)
 * Works universally across Web, iOS, and Android.
 */
export async function uploadImageFile(asset: {
  uri: string;
  base64?: string | null;
  mimeType?: string;
  fileName?: string | null;
  file?: any;
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

  // 1. Resolve base64 data string
  let base64Data: string | null = null;

  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    base64Data = asset.base64.startsWith('data:')
      ? asset.base64
      : `data:${mime};base64,${asset.base64}`;
  } else if (asset.uri.startsWith('data:')) {
    base64Data = asset.uri;
  } else {
    // Attempt blob conversion on web
    base64Data = await blobUriToDataUrl(asset.uri);
  }

  // 2. If we have base64 payload, send via JSON (clean, fast, cross-platform)
  if (base64Data) {
    headers['Content-Type'] = 'application/json';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64Data }),
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

  // 3. Fallback to multipart FormData
  try {
    const formData = new FormData();
    const filename = asset.fileName || `image-${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      // If web asset has actual File/Blob object
      if (asset.file instanceof Blob) {
        formData.append('file', asset.file, filename);
      } else {
        const blobRes = await fetch(asset.uri);
        const blob = await blobRes.blob();
        formData.append('file', blob, filename);
      }
    } else {
      // Native React Native FormData
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);
    }

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
