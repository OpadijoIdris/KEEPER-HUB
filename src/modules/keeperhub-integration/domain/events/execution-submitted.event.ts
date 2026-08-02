import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface ExecutionSubmittedPayload extends Record<string, unknown> {
  agentId: string;
  keeperHubExecutionId: string;
  kind: string;
  params: Record<string, unknown>;
}

export class ExecutionSubmittedEvent extends DomainEvent<ExecutionSubmittedPayload> {
  readonly eventType = 'keeperhub.execution.submitted';
  readonly schemaVersion = 1;
}
