import { randomUUID } from 'crypto';

export interface DomainEventSubject {
  type: string;
  id: string;
}

export interface DomainEventActor {
  type: 'system' | 'agent' | 'user';
  id: string;
}

export type DomainEventSeverity = 'info' | 'warning' | 'critical';

interface DomainEventParams<TPayload> {
  correlationId: string;
  payload: TPayload;
  /** What this event is about — required, since Audit Logs relies on it and has no way to guess. */
  subject: DomainEventSubject;
  actor?: DomainEventActor;
  severity?: DomainEventSeverity;
}

/**
 * Base for every event a module publishes on the shared event bus (see
 * docs/ARCHITECTURE.md §1.1, §10.1). schemaVersion lets a payload shape
 * change later without breaking consumers reading older stored/queued
 * events written under a previous version.
 *
 * subject/actor/severity are declared here, by the event itself, rather
 * than inferred later by Audit Logs from an opaque payload — the event's
 * own module is the only place that actually knows what it's about.
 */
export abstract class DomainEvent<TPayload extends Record<string, unknown>> {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly correlationId: string;
  readonly payload: TPayload;
  readonly subject: DomainEventSubject;
  readonly actor: DomainEventActor;
  readonly severity: DomainEventSeverity;

  abstract readonly eventType: string;
  abstract readonly schemaVersion: number;

  constructor(params: DomainEventParams<TPayload>) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.correlationId = params.correlationId;
    this.payload = params.payload;
    this.subject = params.subject;
    this.actor = params.actor ?? { type: 'system', id: 'system' };
    this.severity = params.severity ?? 'info';
  }
}
