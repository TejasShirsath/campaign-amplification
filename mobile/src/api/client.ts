import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';
import { auth0Service } from '../services/auth0';

const TOKEN_KEY = '@rippleup_token';

let memoryToken: string | null = null;

export async function setAuthToken(token: string | null) {
  memoryToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getAuthToken(): Promise<string | null> {
  // 1. Try real Auth0 active/refreshed access token
  try {
    const auth0Token = await auth0Service.getValidAccessToken();
    if (auth0Token) {
      memoryToken = auth0Token;
      return auth0Token;
    }
  } catch {
    // continue
  }

  // 2. Fallback to memory or custom/demo token if explicitly set
  if (memoryToken) return memoryToken;
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // fallback
  }

  return null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export class ApiErrorResponse extends Error {
  code: string;
  details?: any[];
  status: number;

  constructor(status: number, message: string, code = 'UNKNOWN_ERROR', details?: any[]) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    requiresAuth?: boolean;
    params?: Record<string, any>;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
    params,
  } = options;

  // Normalize URL resolution
  let base = (Config.API_BASE_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
  let path = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;

  // If base already contains /api/v1, strip it so we can append path consistently
  if (base.endsWith('/api/v1')) {
    base = base.slice(0, -7);
  }

  // Ensure path starts with /api/v1 unless it's a root endpoint like /health
  if (!path.startsWith('/api/v1') && path !== '/health' && path !== '/ready') {
    path = `/api/v1${path}`;
  }

  let url = `${base}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    if (__DEV__) {
      console.log(`[API Request] ${method} ${url}`);
    }

    let response = await fetch(url, fetchOptions);

    // If 401 Unauthorized on protected endpoint, try to refresh Auth0 access token once
    if (response.status === 401 && requiresAuth) {
      try {
        const refreshedToken = await auth0Service.refreshAccessToken();
        if (refreshedToken) {
          reqHeaders['Authorization'] = `Bearer ${refreshedToken}`;
          fetchOptions.headers = reqHeaders;
          response = await fetch(url, fetchOptions);
        }
      } catch {
        // continue to error processing
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let json: any;
    if (contentType.includes('application/json')) {
      json = await response.json();
    } else {
      const rawText = await response.text();
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new ApiErrorResponse(
          response.status,
          `Received non-JSON response from server (${response.status}): ${rawText.slice(0, 120)}`,
          'INVALID_RESPONSE'
        );
      }
    }

    if (!response.ok || json?.success === false) {
      const errMsg = json?.error?.message || `HTTP error ${response.status}`;
      const errCode = json?.error?.code || 'ERROR';
      throw new ApiErrorResponse(response.status, errMsg, errCode, json?.error?.details);
    }

    if (__DEV__) {
      console.log(`[API Success] ${method} ${url} (${response.status})`);
    }

    // Return json.data directly or json if data is not present
    return json.data !== undefined ? json.data : (json as unknown as T);
  } catch (error: any) {
    if (__DEV__) {
      console.warn(`[API Failure] ${method} ${url}:`, error?.message || error);
    }
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(500, error.message || 'Network request failed', 'NETWORK_ERROR');
  }
}
