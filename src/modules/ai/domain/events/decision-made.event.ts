import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface DecisionMadePayload extends Record<string, unknown> {
  agentId: string;
  outcome: string;
  rationale: string;
  resultingExecutionId?: string;
}

export class DecisionMadeEvent extends DomainEvent<DecisionMadePayload> {
  readonly eventType = 'ai.decision.made';
  readonly schemaVersion = 1;
}
