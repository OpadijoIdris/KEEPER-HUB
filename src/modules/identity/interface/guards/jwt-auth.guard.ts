import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedError } from '../../../../shared/domain/domain-error.base';

/**
 * The AuthGuard every other module's controllers depend on (see
 * docs/ARCHITECTURE.md §7.1) — this is why Identity had to be built before
 * Settings. Rethrows Passport's own error as our UnauthorizedError so it
 * flows through the same DomainExceptionFilter as every other failure,
 * rather than Passport's default UnauthorizedException with a different
 * response shape.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = Express.User>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedError('Missing or invalid access token.');
    }
    return user;
  }
}
