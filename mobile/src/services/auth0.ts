import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Config } from '../constants/config';

// Ensure WebBrowser finishes redirect on web
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@rippleup_access_token',
  REFRESH_TOKEN: '@rippleup_refresh_token',
  ID_TOKEN: '@rippleup_id_token',
  TOKEN_EXPIRY: '@rippleup_token_expiry',
  USER_CACHE: '@rippleup_user_cache',
};

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  expiresAt: number; // timestamp in ms
}

export interface IdTokenPayload {
  sub: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  [key: string]: any;
}

/**
 * Generate a random cryptographic string for PKCE code verifier and state
 */
function generateRandomString(length = 43): string {
  const bytes = Crypto.getRandomBytes(length);
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

/**
 * Generate PKCE code challenge from verifier using SHA-256 Base64URL
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  // Convert standard Base64 to URL-safe Base64URL
  return digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Parse JWT payload without external library
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    // Atob compatible decoding
    if (typeof atob === 'function') {
      const jsonStr = atob(base64);
      return JSON.parse(jsonStr);
    } else {
      // Buffer fallback for react-native
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = '';
      for (let i = 0; i < base64.length; i += 4) {
        const enc1 = chars.indexOf(base64.charAt(i));
        const enc2 = chars.indexOf(base64.charAt(i + 1));
        const enc3 = chars.indexOf(base64.charAt(i + 2));
        const enc4 = chars.indexOf(base64.charAt(i + 3));

        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;

        str += String.fromCharCode(chr1);
        if (enc3 !== 64) str += String.fromCharCode(chr2);
        if (enc4 !== 64) str += String.fromCharCode(chr3);
      }
      return JSON.parse(str);
    }
  } catch (err) {
    console.warn('Failed to decode JWT payload:', err);
    return null;
  }
}

class Auth0Service {
  private inMemoryAccessToken: string | null = null;
  private inMemoryExpiresAt: number = 0;
  private refreshPromise: Promise<string | null> | null = null;
  private inflightExchanges: Map<string, Promise<AuthTokens>> = new Map();
  private exchangedCodes: Map<string, { tokens: AuthTokens; timestamp: number }> = new Map();

  /**
   * Determine the redirect URI for the current platform
   */
  getRedirectUri(): string {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/auth`;
    }

    return AuthSession.makeRedirectUri({
      scheme: 'rippleup',
      path: 'auth',
    });
  }

  /**
   * Save session tokens into storage
   */
  async saveTokens(tokens: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
  }): Promise<AuthTokens> {
    const expiresIn = tokens.expiresIn || 86400;
    const expiresAt = Date.now() + expiresIn * 1000;

    this.inMemoryAccessToken = tokens.accessToken;
    this.inMemoryExpiresAt = expiresAt;

    const items: [string, string][] = [
      [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
      [STORAGE_KEYS.TOKEN_EXPIRY, String(expiresAt)],
    ];

    if (tokens.refreshToken) {
      items.push([STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken]);
    }
    if (tokens.idToken) {
      items.push([STORAGE_KEYS.ID_TOKEN, tokens.idToken]);
    }

    await AsyncStorage.multiSet(items);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn,
      expiresAt,
    };
  }

  /**
   * Clear all stored session tokens and cached user data
   */
  async clearSession(): Promise<void> {
    this.inMemoryAccessToken = null;
    this.inMemoryExpiresAt = 0;
    this.refreshPromise = null;
    this.inflightExchanges.clear();
    this.exchangedCodes.clear();

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.ID_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.USER_CACHE,
      '@rippleup_token',
    ]);
  }

  /**
   * Load stored tokens from AsyncStorage
   */
  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken, idToken, expiryStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.ID_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      if (!accessToken) return null;

      const expiresAt = expiryStr ? parseInt(expiryStr, 10) : 0;
      this.inMemoryAccessToken = accessToken;
      this.inMemoryExpiresAt = expiresAt;

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        idToken: idToken || undefined,
        expiresAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Refresh the access token using the stored refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    // Avoid multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          await this.clearSession();
          return null;
        }

        const domain = Config.AUTH0.domain.replace(/\/+$/, '');
        const clientId = Config.AUTH0.clientId;

        const res = await fetch(`https://${domain}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            refresh_token: refreshToken,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('[Auth0 Refresh Failed]', res.status, errData);
          if (errData.error === 'invalid_grant' || res.status === 400 || res.status === 401) {
            // Token is revoked or invalid: clear session
            await this.clearSession();
          }
          return null;
        }

        const data = await res.json();
        const saved = await this.saveTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
          idToken: data.id_token,
          expiresIn: data.expires_in,
        });

        return saved.accessToken;
      } catch (err) {
        console.warn('[Auth0 Refresh Error]', err);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get an active access token, refreshing automatically if close to expiration (within 2 min)
   */
  async getValidAccessToken(): Promise<string | null> {
    if (this.inMemoryAccessToken) {
      const now = Date.now();
      // If token has at least 2 minutes of lifetime left, return it
      if (this.inMemoryExpiresAt > now + 120 * 1000) {
        return this.inMemoryAccessToken;
      }
    }

    // Try reading from storage
    const tokens = await this.getStoredTokens();
    if (!tokens) return null;

    const now = Date.now();
    if (tokens.expiresAt > now + 120 * 1000) {
      return tokens.accessToken;
    }

    // Token is expired or expiring soon, refresh it
    if (tokens.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) return refreshed;
    }

    // If refresh not possible but token hasn't fully expired yet
    if (tokens.expiresAt > now) {
      return tokens.accessToken;
    }

    // Fully expired and cannot refresh
    await this.clearSession();
    return null;
  }

  /**
   * Perform Authorization Code with PKCE authentication flow
   */
  async authenticate(options: { isSignUp?: boolean } = {}): Promise<AuthTokens> {
    const domain = Config.AUTH0.domain.replace(/\/+$/, '');
    const clientId = Config.AUTH0.clientId;
    const audience = Config.AUTH0.audience;
    const redirectUri = this.getRedirectUri();

    // 1. Generate PKCE verifier and challenge
    const verifier = generateRandomString(48);
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString(32);

    // Save PKCE verifier and state to storage so web full-page redirect callback can exchange code
    await AsyncStorage.multiSet([
      ['@rippleup_pkce_verifier', verifier],
      ['@rippleup_auth_state', state],
    ]);

    // 2. Build Auth0 authorize URL
    const queryParams: Record<string, string> = {
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email offline_access',
      audience: audience,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state,
    };

    if (options.isSignUp) {
      queryParams['screen_hint'] = 'signup';
    } else {
      queryParams['prompt'] = 'login';
    }

    const authUrl = `https://${domain}/authorize?` + new URLSearchParams(queryParams).toString();

    // 3. Open browser session for user login/signup
    const authResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (authResult.type !== 'success') {
      // On Android / Mobile: when Chrome Custom Tabs is dismissed because an OS Intent
      // deep link routed to the app, check if tokens were already exchanged via /auth
      if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
        // Wait briefly for the concurrent deep-link callback to complete exchange
        await new Promise((resolve) => setTimeout(resolve, 400));
        const storedTokens = await this.getStoredTokens();
        if (storedTokens?.accessToken) {
          return storedTokens;
        }
        throw new Error('Authentication was cancelled');
      }
      throw new Error(`Authentication failed with status: ${authResult.type}`);
    }

    // 4. Parse authorization code from callback URL
    const callbackUrl = authResult.url;
    const urlObj = new URL(callbackUrl);
    const code = urlObj.searchParams.get('code');
    const returnedState = urlObj.searchParams.get('state');
    const errorParam = urlObj.searchParams.get('error');
    const errorDescription = urlObj.searchParams.get('error_description');

    if (errorParam) {
      if (
        errorParam === 'access_denied' ||
        errorParam.toLowerCase().includes('cancel') ||
        errorDescription?.toLowerCase().includes('cancel') ||
        errorDescription?.toLowerCase().includes('closed')
      ) {
        throw new Error('Authentication was cancelled');
      }
      throw new Error(errorDescription || `Auth0 Error: ${errorParam}`);
    }

    if (!code) {
      throw new Error('No authorization code was returned by Auth0');
    }

    if (returnedState && returnedState !== state) {
      throw new Error('Security check failed: state parameter mismatch');
    }

    return this.exchangeCode(code, verifier);
  }

  /**
   * Exchange an authorization code for tokens directly using saved or provided verifier.
   * Fully deduplicated to safely handle concurrent calls from browser and deep links.
   */
  async exchangeCode(code: string, providedVerifier?: string): Promise<AuthTokens> {
    // 1. If this code was already exchanged in the last 60 seconds, return cached tokens
    const recent = this.exchangedCodes.get(code);
    if (recent && Date.now() - recent.timestamp < 60000) {
      return recent.tokens;
    }

    // 2. If an exchange is already in flight for this exact code, join it
    const existing = this.inflightExchanges.get(code);
    if (existing) {
      return existing;
    }

    const exchangePromise = (async (): Promise<AuthTokens> => {
      try {
        const domain = Config.AUTH0.domain.replace(/\/+$/, '');
        const clientId = Config.AUTH0.clientId;
        const redirectUri = this.getRedirectUri();

        let verifier = providedVerifier;
        if (!verifier) {
          verifier = (await AsyncStorage.getItem('@rippleup_pkce_verifier')) || undefined;
        }

        if (!verifier) {
          // If verifier was already consumed by a parallel call, check if stored tokens exist
          const stored = await this.getStoredTokens();
          if (stored) return stored;
          throw new Error('Cannot complete sign-in: PKCE code verifier is missing.');
        }

        const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            code,
            code_verifier: verifier,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errJson = await tokenResponse.json().catch(() => ({}));
          // If code was already exchanged by another listener in this session, check stored tokens
          if (errJson.error === 'invalid_grant' || tokenResponse.status === 400) {
            const currentValid = await this.getStoredTokens();
            if (currentValid) {
              return currentValid;
            }
          }
          throw new Error(
            errJson.error_description || errJson.error || `Token exchange failed (${tokenResponse.status})`
          );
        }

        const tokenData = await tokenResponse.json();

        // Clean up temporary verifier
        await AsyncStorage.multiRemove(['@rippleup_pkce_verifier', '@rippleup_auth_state']);

        const tokens = await this.saveTokens({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          idToken: tokenData.id_token,
          expiresIn: tokenData.expires_in,
        });

        this.exchangedCodes.set(code, { tokens, timestamp: Date.now() });
        return tokens;
      } finally {
        this.inflightExchanges.delete(code);
      }
    })();

    this.inflightExchanges.set(code, exchangePromise);
    return exchangePromise;
  }

  /**
   * Determine the post-logout return URI for the current platform
   */
  getLogoutReturnUri(): string {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}`;
    }

    return AuthSession.makeRedirectUri({
      scheme: 'rippleup',
    });
  }

  /**
   * Log out of Auth0 session and clear local storage
   */
  async logout(): Promise<void> {
    const domain = Config.AUTH0.domain.replace(/\/+$/, '');
    const clientId = Config.AUTH0.clientId;
    const returnTo = this.getLogoutReturnUri();

    // 1. Immediately wipe all local tokens and session caches
    await this.clearSession();

    // 2. Clear Auth0 cookies
    const logoutUrl = `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Direct browser redirect on Web to logout and return to base origin
        window.location.href = logoutUrl;
      } catch (err) {
        console.warn('Web logout redirect error:', err);
      }
    } else {
      try {
        await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);
      } catch (err) {
        console.warn('Native logout session dismissed or failed:', err);
      }
    }
  }

  /**
   * Fetch user info directly from Auth0 /userinfo endpoint
   */
  async fetchUserInfo(accessToken: string): Promise<IdTokenPayload | null> {
    try {
      const domain = Config.AUTH0.domain.replace(/\/+$/, '');
      const res = await fetch(`https://${domain}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return (await res.json()) as IdTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get user profile details (name, picture, email) from Auth0 ID token or /userinfo endpoint
   */
  async getAuth0UserProfile(accessToken?: string): Promise<IdTokenPayload | null> {
    try {
      // 1. Try decoding stored ID token first (instant, zero network latency)
      const storedIdToken = await AsyncStorage.getItem(STORAGE_KEYS.ID_TOKEN);
      if (storedIdToken) {
        const decoded = decodeJwtPayload<IdTokenPayload>(storedIdToken);
        if (decoded && (decoded.picture || decoded.name || decoded.email)) {
          AsyncStorage.setItem(STORAGE_KEYS.USER_CACHE, JSON.stringify(decoded)).catch(() => {});
          return decoded;
        }
      }

      // 2. Fetch fresh user info from /userinfo endpoint
      const token = accessToken || (await this.getValidAccessToken());
      if (token) {
        const userInfo = await this.fetchUserInfo(token);
        if (userInfo) {
          AsyncStorage.setItem(STORAGE_KEYS.USER_CACHE, JSON.stringify(userInfo)).catch(() => {});
          return userInfo;
        }
      }

      // 3. Fallback to cached user data if offline or network failure
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER_CACHE);
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER_CACHE);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
      return null;
    }
  }
}

export const auth0Service = new Auth0Service();
