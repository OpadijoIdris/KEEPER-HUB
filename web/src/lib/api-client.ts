import { tokenStore } from './token-store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Thrown when the caller has no usable session at all — UI should redirect to /login. */
export class UnauthenticatedError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'UnauthenticatedError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Internal — prevents an infinite retry loop if refresh itself 401s. */
  isRetry?: boolean;
}

async function parseErrorBody(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({}));
  // Domain errors (DomainExceptionFilter) vs class-validator's ValidationPipe shape.
  const message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? response.statusText);
  return new ApiError(response.status, body.code ?? 'UNKNOWN', message);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;

  const tokens = await response.json();
  tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return true;
}

/** Public, unauthenticated endpoints — a 401 from these means bad credentials, never an expired session. */
const UNAUTHENTICATED_PATHS = ['/auth/login', '/auth/register'];

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = tokenStore.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isUnauthenticatedEndpoint = UNAUTHENTICATED_PATHS.some((p) => path.startsWith(p));
  if (response.status === 401 && !options.isRetry && !isUnauthenticatedEndpoint) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, isRetry: true });
    }
    tokenStore.clear();
    // Every page that calls apiFetch would otherwise need its own catch for
    // this one case — easy to forget (see SettingsPage, which didn't have
    // one: an expired session left it stuck on "Loading…" forever behind an
    // unhandled promise rejection instead of bouncing to /login). Handled
    // once, here, since apiFetch is the only place that actually knows the
    // session is unrecoverable.
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new UnauthenticatedError();
  }

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
