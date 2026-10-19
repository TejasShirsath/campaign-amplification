import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, userApi } from '../api/user';
import { Config } from '../constants/config';
import { getAuthToken, setAuthToken } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  token: string | null;
  currentRole: 'creator' | 'backer' | 'custom';
  switchDemoUser: (role: 'creator' | 'backer') => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setCustomToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  token: null,
  currentRole: 'creator',
  switchDemoUser: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
  setCustomToken: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(Config.DEMO_USERS.CREATOR.token);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<'creator' | 'backer' | 'custom'>('creator');

  const loadProfile = async (activeToken?: string | null) => {
    try {
      setIsLoading(true);
      const curToken = activeToken !== undefined ? activeToken : await getAuthToken();
      if (!curToken) {
        setUser(null);
        return;
      }
      setToken(curToken);
      if (curToken === Config.DEMO_USERS.CREATOR.token) {
        setCurrentRole('creator');
      } else if (curToken === Config.DEMO_USERS.BACKER.token) {
        setCurrentRole('backer');
      } else {
        setCurrentRole('custom');
      }

      const profile = await userApi.getProfile();
      setUser(profile);
    } catch (err) {
      console.warn('Failed to fetch user profile, using fallback profile:', err);
      // If backend fails or not reachable, provide fallback demo user
      const isBacker = token === Config.DEMO_USERS.BACKER.token;
      const demoConfig = isBacker ? Config.DEMO_USERS.BACKER : Config.DEMO_USERS.CREATOR;
      setUser({
        id: demoConfig.id,
        name: demoConfig.name,
        displayName: demoConfig.displayName,
        email: demoConfig.email,
        bio: demoConfig.bio,
        avatarUrl: demoConfig.avatarUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const switchDemoUser = async (role: 'creator' | 'backer') => {
    setIsLoading(true);
    const newToken = role === 'creator' ? Config.DEMO_USERS.CREATOR.token : Config.DEMO_USERS.BACKER.token;
    await setAuthToken(newToken);
    setToken(newToken);
    setCurrentRole(role);
    await loadProfile(newToken);
  };

  const setCustomToken = async (newToken: string) => {
    setIsLoading(true);
    await setAuthToken(newToken);
    setToken(newToken);
    setCurrentRole('custom');
    await loadProfile(newToken);
  };

  const logout = async () => {
    await setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        token,
        currentRole,
        switchDemoUser,
        refreshProfile: () => loadProfile(token),
        logout,
        setCustomToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
