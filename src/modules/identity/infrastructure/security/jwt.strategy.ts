import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenClaims } from '../../domain/ports/token-issuer.port';
import { AppConfig } from '../../../../config/configuration';

/**
 * Stateless by design — validates the JWT signature/expiry and trusts its
 * claims directly, no DB round trip per request. That's the actual point of
 * using JWTs for the access token instead of a DB-backed session lookup.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.accessSecret', { infer: true }),
    });
  }

  validate(payload: AccessTokenClaims): AccessTokenClaims {
    return payload;
  }
}
