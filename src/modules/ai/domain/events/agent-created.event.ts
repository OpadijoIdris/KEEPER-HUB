import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface AgentCreatedPayload extends Record<string, unknown> {
  ownerId: string;
  name: string;
}

export class AgentCreatedEvent extends DomainEvent<AgentCreatedPayload> {
  readonly eventType = 'ai.agent.created';
  readonly schemaVersion = 1;
}
