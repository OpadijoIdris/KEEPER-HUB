import { Decision } from '../decision.entity';

export const DECISION_REPOSITORY = Symbol('DECISION_REPOSITORY');

export interface DecisionRepository {
  findById(id: string): Promise<Decision | null>;
  findByAgentId(agentId: string): Promise<Decision[]>;
  save(decision: Decision): Promise<void>;
}
