import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/domain-error.base';
// Direct file import, not the `ai` barrel — the barrel re-exports AiModule,
// which imports this module (KeeperHubIntegration), creating a CommonJS
// require() cycle at boot (AgentOwnerGuard ends up `undefined`).
// eslint-disable-next-line boundaries/element-types -- see comment above
import { AgentService } from '../../../ai/application/services/agent.service';
import { ExecutionService } from '../../application/services/execution.service';

interface AuthenticatedRequestUser {
  sub: string;
  role: string;
}

/**
 * Same "owner or admin" rule as AgentOwnerGuard, but for routes keyed by
 * :executionId rather than :agentId (GET/refresh on a single execution) —
 * has to resolve Execution -> agentId -> Agent.ownerId first. AgentService
 * is injectable here without KeeperHubIntegrationModule importing AiModule
 * (which would be circular, since AiModule imports this module) because
 * AiModule is @Global.
 */
export function ExecutionOwnerGuard(routeParamName = 'executionId'): Type<CanActivate> {
  @Injectable()
  class ExecutionOwnerGuardImpl implements CanActivate {
    constructor(
      private readonly executionService: ExecutionService,
      private readonly agentService: AgentService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const user = request.user as AuthenticatedRequestUser | undefined;
      const executionId = request.params[routeParamName];

      if (!user) {
        throw new ForbiddenError('Authentication required.');
      }
      if (user.role === 'admin') {
        return true;
      }

      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        throw new NotFoundError(`Execution "${executionId}" not found.`);
      }

      const agent = await this.agentService.getAgent(execution.agentId);
      if (!agent || agent.ownerId !== user.sub) {
        throw new ForbiddenError('You may only access executions for your own agents.');
      }
      return true;
    }
  }

  return ExecutionOwnerGuardImpl;
}
