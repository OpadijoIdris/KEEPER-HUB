import { Execution } from '../../domain/execution.entity';

export interface ExecutionResponseDto {
  id: string;
  agentId: string;
  kind: string;
  params: Record<string, unknown>;
  status: string;
  keeperHubExecutionId: string | null;
  transactionHash: string | null;
  failureReason: string | null;
  createdAt: string;
}

export function toExecutionResponse(execution: Execution): ExecutionResponseDto {
  return {
    id: execution.id,
    agentId: execution.agentId,
    kind: execution.kind,
    params: execution.params,
    status: execution.status,
    keeperHubExecutionId: execution.keeperHubExecutionId,
    transactionHash: execution.transactionHash,
    failureReason: execution.failureReason,
    createdAt: execution.createdAt.toISOString(),
  };
}
