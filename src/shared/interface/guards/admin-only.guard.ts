import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError } from '../../domain/domain-error.base';

interface AuthenticatedRequestUser {
  sub: string;
  role: string;
}

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedRequestUser | undefined;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenError('This action requires an administrator.');
    }
    return true;
  }
}
