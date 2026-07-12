import { randomUUID } from 'crypto';

/**
 * Base for every event a module publishes on the shared event bus (see
 * docs/ARCHITECTURE.md §1.1, §10.1). schemaVersion lets a payload shape
 * change later without breaking consumers reading older stored/queued
 * events written under a previous version.
 */
export abstract class DomainEvent<TPayload extends Record<string, unknown>> {
  readonly eventId: string;
  readonly occurredAt: Date;
  abstract readonly eventType: string;
  abstract readonly schemaVersion: number;

  constructor(
    readonly correlationId: string,
    readonly payload: TPayload,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
