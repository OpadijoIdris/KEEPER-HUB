import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError } from '../../domain/domain-error.base';

/**
 * Shape-only duplicate of Identity's AccessTokenClaims (see
 * docs/ARCHITECTURE.md §7.3) — shared kernel must not import from a module,
 * even Identity, to keep the dependency direction one-way (modules depend on
 * shared, never the reverse).
 */
interface AuthenticatedRequestUser {
  sub: string;
  role: string;
}

/**
 * "Only the resource owner or an admin" is the simplest ownership case —
 * the resource ID *is* the current user's ID, so no cross-module lookup is
 * needed (contrast with AgentPolicy's ownership check, which has to resolve
 * through the AI module's Public API). Reused across any module with a
 * user-scoped resource (Settings' preferences today, Notifications next).
 */
export function SelfOrAdminGuard(routeParamName: string): Type<CanActivate> {
  @Injectable()
  class SelfOrAdminGuardImpl implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const user = request.user as AuthenticatedRequestUser | undefined;
      const targetUserId = request.params[routeParamName];

      if (!user) {
        throw new ForbiddenError('Authentication required.');
      }
      if (user.role !== 'admin' && user.sub !== targetUserId) {
        throw new ForbiddenError('You may only access your own resources.');
      }
      return true;
    }
  }

  return SelfOrAdminGuardImpl;
}
