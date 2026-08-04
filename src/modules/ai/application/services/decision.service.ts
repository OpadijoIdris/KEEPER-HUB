import { Inject, Injectable } from '@nestjs/common';
import { Decision } from '../../domain/decision.entity';
import { AGENT_REPOSITORY } from '../../domain/ports/agent.repository';
import type { AgentRepository } from '../../domain/ports/agent.repository';
import { DECISION_REPOSITORY } from '../../domain/ports/decision.repository';
import type { DecisionRepository } from '../../domain/ports/decision.repository';
import { AGENT_REASONING } from '../../domain/ports/agent-reasoning.port';
import type { AgentReasoning } from '../../domain/ports/agent-reasoning.port';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import { NotFoundError } from '../../../../shared/domain/domain-error.base';
import { AgentPolicyService } from '../../../settings';
import { ExecutionService } from '../../../keeperhub-integration';

@Injectable()
export class DecisionService {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
    @Inject(AGENT_REASONING) private readonly reasoning: AgentReasoning,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly agentPolicyService: AgentPolicyService,
    private readonly executionService: ExecutionService,
  ) {}

  /**
   * On-demand evaluation (no live trigger system this sprint — see
   * Agent's class doc). This is the actual "AI decides -> KeeperHub
   * executes" path the whole platform exists to demonstrate.
   */
  async evaluate(agentId: string, triggerContext: Record<string, unknown>): Promise<Decision> {
    const agent = await this.agents.findById(agentId);
    if (!agent) throw new NotFoundError(`Agent "${agentId}" not found.`);

    const policy = await this.agentPolicyService.get(agentId);

    const result = await this.reasoning.evaluate({
      agentName: agent.name,
      monitoredTrigger: agent.monitoredTrigger,
      rules: agent.rules,
      triggerContext,
      allowedActions: policy.allowedActions,
    });

    let resultingExecutionId: string | null = null;
    if (result.outcome === 'execute' && result.action) {
      const execution =
        result.action.kind === 'transfer'
          ? await this.executionService.executeTransfer(
              agentId,
              String(result.action.params.chainId ?? ''),
              String(result.action.params.toAddress ?? ''),
              String(result.action.params.amount ?? '0'),
              result.action.params.tokenAddress ? String(result.action.params.tokenAddress) : undefined,
            )
          : await this.executionService.executeProtocolAction(
              agentId,
              String(result.action.params.actionType ?? ''),
              result.action.params,
            );
      resultingExecutionId = execution.id;
    }

    const decision = Decision.record(
      agentId,
      triggerContext,
      result.outcome,
      result.rationale,
      resultingExecutionId,
    );
    await this.decisions.save(decision);
    await this.publishEvents(decision);
    return decision;
  }

  async getDecision(decisionId: string): Promise<Decision | null> {
    return this.decisions.findById(decisionId);
  }

  async listByAgent(agentId: string): Promise<Decision[]> {
    return this.decisions.findByAgentId(agentId);
  }

  private async publishEvents(decision: Decision): Promise<void> {
    for (const event of decision.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
