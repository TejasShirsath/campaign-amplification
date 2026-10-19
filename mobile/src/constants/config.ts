import { Platform } from 'react-native';

// In development:
// - iOS Simulator & Web: http://localhost:5000
// - Android Emulator: http://10.0.2.2:5000
// - Physical device: set to your machine's LAN IP (e.g. http://192.168.1.X:5000)
const DEFAULT_API_HOST = Platform.select({
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

function getApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api/v1';
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_HOST;
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  // Local blobs or base64 data URLs should be returned untouched
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:')) {
    return url;
  }

  // Derive configured API host
  const configuredApi = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_HOST;
  let preferredHost = 'localhost:5000';
  try {
    const match = configuredApi.match(/https?:\/\/([^/]+)/);
    if (match && match[1]) {
      preferredHost = match[1];
    }
  } catch {
    // fallback
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return url.replace(/http:\/\/(?:\d{1,3}\.){3}\d{1,3}:5000/, 'http://localhost:5000');
    }
  } else {
    // On native devices or emulators, map localhost to the reachable IP
    if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
      return url.replace(/http:\/\/(?:localhost|127\.0\.0\.1):5000/, `http://${preferredHost}`);
    }
  }
  return url;
}

export const Config = {
  API_BASE_URL: getApiBaseUrl(),
  AUTH0: {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || 'dev-00mz0uwnaumdf832.us.auth0.com',
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '9hD9qx2PTUVIR91USaRPlC3iWpJn4dmD',
    audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || 'https://dev-00mz0uwnaumdf832.us.auth0.com/api/v2/',
  },
  RAZORPAY: {
    keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_z9mXXfneQCasqW',
  },
  DEMO_USERS: {
    CREATOR: {
      token: 'demo-creator',
      id: 'demo|seed-user-001',
      name: 'Demo Creator',
      displayName: 'RippleUp Demo',
      email: 'demo@rippleup.dev',
      bio: 'A demonstration creator account for the RippleUp Amplification Platform.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
    BACKER: {
      token: 'demo-backer',
      id: 'demo|seed-user-002',
      name: 'Demo Backer',
      displayName: 'Eco Supporter',
      email: 'backer@rippleup.dev',
      bio: 'Passionate about small contributions that create wide ripples of impact.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    },
  },
};
