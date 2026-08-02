import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface ExecutionCompletedPayload extends Record<string, unknown> {
  agentId: string;
  transactionHash?: string;
  result?: unknown;
}

export class ExecutionCompletedEvent extends DomainEvent<ExecutionCompletedPayload> {
  readonly eventType = 'keeperhub.execution.completed';
  readonly schemaVersion = 1;
}
