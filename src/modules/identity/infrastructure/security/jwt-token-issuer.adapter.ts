import { randomBytes, createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenClaims, TokenIssuer } from '../../domain/ports/token-issuer.port';
import { AppConfig } from '../../../../config/configuration';

const REFRESH_TOKEN_BYTES = 32;

@Injectable()
export class JwtTokenIssuerAdapter implements TokenIssuer {
  private readonly refreshTokenPepper: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    // Reuses JWT_REFRESH_SECRET as an HMAC key ("pepper") for hashing opaque
    // refresh tokens, rather than leaving that env var unused — refresh
    // tokens are stored hashed, never as signed JWTs (see token-issuer.port.ts).
    this.refreshTokenPepper = this.configService.get('jwt.refreshSecret', { infer: true });
  }

  signAccessToken(claims: AccessTokenClaims): string {
    return this.jwtService.sign(claims);
  }

  verifyAccessToken(token: string): AccessTokenClaims | null {
    try {
      return this.jwtService.verify<AccessTokenClaims>(token);
    } catch {
      return null;
    }
  }

  generateRefreshToken(): { plaintext: string; hash: string } {
    const plaintext = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    return { plaintext, hash: this.hashRefreshToken(plaintext) };
  }

  hashRefreshToken(plaintext: string): string {
    return createHmac('sha256', this.refreshTokenPepper).update(plaintext).digest('hex');
  }
}
