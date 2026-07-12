export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export interface AccessTokenClaims {
  sub: string;
  role: string;
}

/**
 * External-capability port wrapping all token cryptography (see
 * docs/ARCHITECTURE.md §5.0) — only the infrastructure adapter knows access
 * tokens are JWTs (@nestjs/jwt) and refresh tokens are opaque random values
 * hashed with SHA-256 for storage/lookup (fast hash is correct here, unlike
 * passwords — the refresh token itself is already high-entropy, so there's
 * no offline brute-force risk to slow down against).
 */
export interface TokenIssuer {
  signAccessToken(claims: AccessTokenClaims): string;
  verifyAccessToken(token: string): AccessTokenClaims | null;

  /** A fresh opaque refresh token, plus the hash to persist for later lookup. */
  generateRefreshToken(): { plaintext: string; hash: string };
  /** Re-derives the hash of a presented refresh token, to look it up by hash. */
  hashRefreshToken(plaintext: string): string;
}
