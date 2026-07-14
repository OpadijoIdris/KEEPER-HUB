/**
 * localStorage-backed for now (simplest thing that survives a page reload
 * during a demo). Known tradeoff, tracked in the backend's ROADMAP.md as
 * "refresh token -> httpOnly cookie" hardening — this file is exactly what
 * gets deleted/simplified once that ships, since the browser would handle
 * the refresh token via cookie instead.
 */
const ACCESS_TOKEN_KEY = 'keeperhub.accessToken';
const REFRESH_TOKEN_KEY = 'keeperhub.refreshToken';

export const tokenStore = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
