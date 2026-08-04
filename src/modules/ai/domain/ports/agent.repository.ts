import { Agent } from '../agent.entity';

export const AGENT_REPOSITORY = Symbol('AGENT_REPOSITORY');

export interface AgentRepository {
  findById(id: string): Promise<Agent | null>;
  findByOwnerId(ownerId: string): Promise<Agent[]>;
  save(agent: Agent): Promise<void>;
}
