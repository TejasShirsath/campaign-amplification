import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserProfile, userApi } from '../api/user';
import { setAuthToken } from '../api/client';
import { auth0Service, decodeJwtPayload, IdTokenPayload } from '../services/auth0';
import { AuthModal } from '../components/common/auth-modal';

export interface PromptAuthOptions {
  title?: string;
  reason?: string;
  onSuccess?: () => void | Promise<void>;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  token: string | null;
  signIn: () => Promise<boolean>;
  signUp: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  promptAuth: (options?: PromptAuthOptions) => void;
  closeAuthPrompt: () => void;
  switchDemoUser: (role: 'creator' | 'backer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAuthenticating: false,
  token: null,
  signIn: async () => false,
  signUp: async () => false,
  logout: async () => {},
  refreshProfile: async () => {},
  promptAuth: () => {},
  closeAuthPrompt: () => {},
  switchDemoUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auth prompt modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('Join RippleUp');
  const [modalReason, setModalReason] = useState(
    'Sign in or create an account to start campaigns, save causes, and track your impact.'
  );
  const pendingSuccessCallbackRef = useRef<(() => void | Promise<void>) | null>(null);

  /**
   * Load backend user profile for the current token
   */
  const loadProfile = useCallback(async (activeToken?: string | null): Promise<UserProfile | null> => {
    try {
      const curToken = activeToken !== undefined ? activeToken : await auth0Service.getValidAccessToken();
      if (!curToken) {
        setUser(null);
        setToken(null);
        await setAuthToken(null);
        return null;
      }

      setToken(curToken);
      await setAuthToken(curToken);

      let profile: UserProfile | null = null;
      try {
        profile = await userApi.getProfile();
      } catch (profileErr: any) {
        console.warn('[loadProfile] Failed to fetch backend profile:', profileErr?.message || profileErr);
        if (profileErr?.status === 401) {
          const refreshed = await auth0Service.refreshAccessToken();
          if (refreshed) {
            setToken(refreshed);
            await setAuthToken(refreshed);
            profile = await userApi.getProfile().catch(() => null);
          }
        }
      }

      // Fetch Auth0 / Google claims (name, picture, email)
      const auth0User = await auth0Service.getAuth0UserProfile(curToken);

      const resolvedName = profile?.name || auth0User?.name || auth0User?.nickname || '';
      const resolvedDisplayName =
        profile?.displayName && profile.displayName !== 'RippleUp Creator'
          ? profile.displayName
          : (resolvedName || (auth0User?.email ? auth0User.email.split('@')[0] : 'RippleUp User'));
      const resolvedAvatar = profile?.avatarUrl || auth0User?.picture || undefined;
      const resolvedEmail = profile?.email || auth0User?.email || '';

      const mergedUser: UserProfile = {
        id: profile?.id || auth0User?.sub || 'user_current',
        name: resolvedName,
        displayName: resolvedDisplayName,
        avatarUrl: resolvedAvatar,
        email: resolvedEmail,
        bio: profile?.bio,
        createdAt: profile?.createdAt,
      };

      setUser(mergedUser);

      // If backend record was missing avatar or displayName, sync with backend
      if (profile && ((!profile.avatarUrl && resolvedAvatar) || (!profile.displayName && resolvedDisplayName))) {
        userApi.updateProfile({
          displayName: resolvedDisplayName,
          avatarUrl: resolvedAvatar,
        }).catch((e) => console.warn('[Profile Sync Error]', e));
      }

      return mergedUser;
    } catch (err: any) {
      console.warn('[loadProfile] Fatal error resolving profile:', err?.message || err);
      return null;
    }
  }, []);

  /**
   * Restore stored session on app startup
   */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const storedTokens = await auth0Service.getStoredTokens();
        if (storedTokens?.accessToken) {
          await loadProfile(storedTokens.accessToken);
        } else {
          // Guest mode
          setUser(null);
          setToken(null);
          await setAuthToken(null);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
        setUser(null);
        setToken(null);
        await setAuthToken(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  /**
   * Sign In with Auth0
   */
  const signIn = async (): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const tokens = await auth0Service.authenticate({ isSignUp: false });
      setToken(tokens.accessToken);
      await setAuthToken(tokens.accessToken);

      // Load real backend profile
      await loadProfile(tokens.accessToken);

      // Execute any pending action that requested authentication
      if (pendingSuccessCallbackRef.current) {
        try {
          await pendingSuccessCallbackRef.current();
        } catch (callbackErr) {
          console.warn('[Pending Callback Error]', callbackErr);
        }
        pendingSuccessCallbackRef.current = null;
      }

      return true;
    } catch (err: any) {
      if (err?.message === 'Authentication was cancelled') {
        throw err;
      }
      console.error('[Auth0 SignIn Error]', err);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Sign Up with Auth0
   */
  const signUp = async (): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const tokens = await auth0Service.authenticate({ isSignUp: true });
      setToken(tokens.accessToken);
      await setAuthToken(tokens.accessToken);

      // Load real backend profile (or backend auto-creates on first request)
      await loadProfile(tokens.accessToken);

      if (pendingSuccessCallbackRef.current) {
        try {
          await pendingSuccessCallbackRef.current();
        } catch (callbackErr) {
          console.warn('[Pending Callback Error]', callbackErr);
        }
        pendingSuccessCallbackRef.current = null;
      }

      return true;
    } catch (err: any) {
      if (err?.message === 'Authentication was cancelled') {
        throw err;
      }
      console.error('[Auth0 SignUp Error]', err);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Log out of current Auth0 session
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await setAuthToken(null);
      setToken(null);
      setUser(null);
      await auth0Service.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open the polished Auth prompt modal with optional action callback
   */
  const promptAuth = (options?: PromptAuthOptions) => {
    if (options?.title) setModalTitle(options.title);
    else setModalTitle('Join RippleUp');

    if (options?.reason) setModalReason(options.reason);
    else setModalReason('Sign in or create an account to start campaigns, save causes, and track your impact.');

    pendingSuccessCallbackRef.current = options?.onSuccess || null;
    setModalVisible(true);
  };

  const closeAuthPrompt = () => {
    setModalVisible(false);
    pendingSuccessCallbackRef.current = null;
  };

  /**
   * Optional demo account switcher for testing roles
   */
  const switchDemoUser = async (role: 'creator' | 'backer') => {
    setIsLoading(true);
    const demoToken = role === 'creator' ? 'demo-creator' : 'demo-backer';
    await setAuthToken(demoToken);
    setToken(demoToken);
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      // fallback
      setUser({
        id: role === 'creator' ? 'demo|seed-user-001' : 'demo|seed-user-002',
        name: role === 'creator' ? 'Demo Creator' : 'Demo Backer',
        displayName: role === 'creator' ? 'CampaignAmp Demo' : 'Eco Supporter',
        email: role === 'creator' ? 'demo@campaignamplify.dev' : 'backer@campaignamplify.dev',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthenticating,
        token,
        signIn,
        signUp,
        logout,
        refreshProfile: async () => {
          await loadProfile(token);
        },
        promptAuth,
        closeAuthPrompt,
        switchDemoUser,
      }}
    >
      {children}

      {/* Global Auth Modal */}
      <AuthModal
        visible={modalVisible}
        onClose={closeAuthPrompt}
        onSignIn={signIn}
        onSignUp={signUp}
        title={modalTitle}
        reason={modalReason}
        isAuthenticating={isAuthenticating}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
