import { Agent } from '../../domain/agent.entity';
import { Decision } from '../../domain/decision.entity';

export interface AgentResponseDto {
  id: string;
  ownerId: string;
  name: string;
  monitoredTrigger: string;
  rules: string;
  status: string;
  createdAt: string;
}

export interface DecisionResponseDto {
  id: string;
  agentId: string;
  triggerContext: Record<string, unknown>;
  outcome: string;
  rationale: string;
  resultingExecutionId: string | null;
  evaluatedAt: string;
}

export function toAgentResponse(agent: Agent): AgentResponseDto {
  return {
    id: agent.id,
    ownerId: agent.ownerId,
    name: agent.name,
    monitoredTrigger: agent.monitoredTrigger,
    rules: agent.rules,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
  };
}

export function toDecisionResponse(decision: Decision): DecisionResponseDto {
  return {
    id: decision.id,
    agentId: decision.agentId,
    triggerContext: decision.triggerContext,
    outcome: decision.outcome,
    rationale: decision.rationale,
    resultingExecutionId: decision.resultingExecutionId,
    evaluatedAt: decision.evaluatedAt.toISOString(),
  };
}
