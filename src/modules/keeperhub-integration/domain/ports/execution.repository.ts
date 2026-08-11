import { Execution, ExecutionStatus } from '../execution.entity';

export const EXECUTION_REPOSITORY = Symbol('EXECUTION_REPOSITORY');

export interface ExecutionRepository {
  findById(id: string): Promise<Execution | null>;
  findByAgentId(agentId: string): Promise<Execution[]>;
  findByStatus(status: ExecutionStatus): Promise<Execution[]>;
  save(execution: Execution): Promise<void>;
}
