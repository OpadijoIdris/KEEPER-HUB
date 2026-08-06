import { Inject, Injectable } from '@nestjs/common';
import { AgentPolicy } from '../../domain/agent-policy.entity';
import { AGENT_POLICY_REPOSITORY } from '../../domain/ports/agent-policy.repository';
import type { AgentPolicyRepository } from '../../domain/ports/agent-policy.repository';

@Injectable()
export class AgentPolicyService {
  constructor(
    @Inject(AGENT_POLICY_REPOSITORY) private readonly repository: AgentPolicyRepository,
  ) {}

  async get(agentId: string): Promise<AgentPolicy> {
    return (await this.repository.findByAgentId(agentId)) ?? AgentPolicy.createDefault(agentId);
  }

  async update(agentId: string, spendLimit?: string, allowedActions?: string[]): Promise<AgentPolicy> {
    const policy = await this.get(agentId);
    policy.update(spendLimit, allowedActions);
    await this.repository.save(policy);
    return policy;
  }

  /** Wallet's Public API consumer — see docs/ARCHITECTURE.md §7.3, §9.2. */
  async permits(
    agentId: string,
    kind: string,
    amount: string,
    cumulativeSpendSoFar: number,
  ): Promise<boolean> {
    const policy = await this.get(agentId);
    return policy.permits(kind, amount, cumulativeSpendSoFar);
  }
}
