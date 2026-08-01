import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';
import type {
  DomainEventActor,
  DomainEventSeverity,
  DomainEventSubject,
} from '../../../shared/domain/domain-event.base';

interface AuditEntryProps {
  id: string;
  correlationId: string;
  occurredAt: Date;
  eventType: string;
  schemaVersion: number;
  subject: DomainEventSubject;
  actor: DomainEventActor;
  severity: DomainEventSeverity;
  payload: Record<string, unknown>;
}

/**
 * Append-only by omission, not by a runtime check (see docs/ARCHITECTURE.md
 * §10.1) — no update/delete method exists on this class or its repository
 * port at all. A leaf aggregate root: no child entities, nothing else
 * references it.
 */
export class AuditEntry extends Entity<string> {
  readonly correlationId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly schemaVersion: number;
  readonly subject: DomainEventSubject;
  readonly actor: DomainEventActor;
  readonly severity: DomainEventSeverity;
  readonly payload: Record<string, unknown>;

  private constructor(props: AuditEntryProps) {
    super(props.id);
    this.correlationId = props.correlationId;
    this.occurredAt = props.occurredAt;
    this.eventType = props.eventType;
    this.schemaVersion = props.schemaVersion;
    this.subject = props.subject;
    this.actor = props.actor;
    this.severity = props.severity;
    this.payload = props.payload;
  }

  static record(props: Omit<AuditEntryProps, 'id'>): AuditEntry {
    return new AuditEntry({ ...props, id: randomUUID() });
  }

  static fromPersistence(props: AuditEntryProps): AuditEntry {
    return new AuditEntry(props);
  }
}
