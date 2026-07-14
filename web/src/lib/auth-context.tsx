import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiFetch } from './api-client';
import { tokenStore } from './token-store';
import { decodeAccessToken, type AccessTokenClaims } from './jwt';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AccessTokenClaims | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadInitialUser(): AccessTokenClaims | null {
  const token = tokenStore.getAccessToken();
  return token ? decodeAccessToken(token) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccessTokenClaims | null>(loadInitialUser);

  const applyTokens = useCallback((tokens: AuthTokens) => {
    tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(decodeAccessToken(tokens.accessToken));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiFetch<AuthTokens>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiFetch<AuthTokens>('/auth/register', {
        method: 'POST',
        body: { email, password },
      });
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
