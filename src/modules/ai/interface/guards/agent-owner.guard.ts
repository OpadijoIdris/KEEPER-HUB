import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/domain-error.base';
import { AgentService } from '../../application/services/agent.service';

interface AuthenticatedRequestUser {
  sub: string;
  role: string;
}

/**
 * "Only the agent's owner or an admin" — every /agents/:agentId/* route
 * across Wallet, Settings, KeeperHub Integration, and AI itself needs this
 * exact check, but only AI knows what Agent.ownerId is (see
 * shared/interface/guards/self-or-admin.guard.ts's doc comment, which
 * anticipated this). Exported via AI's Public API rather than living in
 * shared/, since shared/ must not depend on any module — this one has to.
 */
export function AgentOwnerGuard(routeParamName = 'agentId'): Type<CanActivate> {
  @Injectable()
  class AgentOwnerGuardImpl implements CanActivate {
    constructor(private readonly agentService: AgentService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const user = request.user as AuthenticatedRequestUser | undefined;
      const agentId = request.params[routeParamName];

      if (!user) {
        throw new ForbiddenError('Authentication required.');
      }
      if (user.role === 'admin') {
        return true;
      }

      const agent = await this.agentService.getAgent(agentId);
      if (!agent) {
        throw new NotFoundError(`Agent "${agentId}" not found.`);
      }
      if (agent.ownerId !== user.sub) {
        throw new ForbiddenError('You may only access your own agents.');
      }
      return true;
    }
  }

  return AgentOwnerGuardImpl;
}
