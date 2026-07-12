import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenClaims } from '../../domain/ports/token-issuer.port';

/**
 * Every module's controllers pull the authenticated caller this way — see
 * docs/ARCHITECTURE.md §7.3 for the ownership checks built on top of it.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenClaims => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AccessTokenClaims;
  },
);
