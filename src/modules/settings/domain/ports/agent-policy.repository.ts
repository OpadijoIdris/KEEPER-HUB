import { AgentPolicy } from '../agent-policy.entity';

export const AGENT_POLICY_REPOSITORY = Symbol('AGENT_POLICY_REPOSITORY');

export interface AgentPolicyRepository {
  findByAgentId(agentId: string): Promise<AgentPolicy | null>;
  save(policy: AgentPolicy): Promise<void>;
}
