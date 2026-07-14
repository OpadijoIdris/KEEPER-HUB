export interface AccessTokenClaims {
  sub: string;
  role: string;
  exp: number;
}

/** Decodes the payload only — never trust this for authorization, the server re-verifies signature/expiry on every request. It's purely for showing "who's logged in" in the UI. */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}
