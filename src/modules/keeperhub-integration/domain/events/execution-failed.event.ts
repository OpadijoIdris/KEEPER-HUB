import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface ExecutionFailedPayload extends Record<string, unknown> {
  agentId: string;
  reason: string;
}

export class ExecutionFailedEvent extends DomainEvent<ExecutionFailedPayload> {
  readonly eventType = 'keeperhub.execution.failed';
  readonly schemaVersion = 1;
}
