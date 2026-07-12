import { Entity } from './entity.base';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DomainEvent } from './domain-event.base';

/**
 * Base for every aggregate root. Domain events raised during a command are
 * buffered here, not published immediately — the owning application service
 * publishes them via EventBusPort only after the repository save succeeds,
 * so a failed persistence never results in a "phantom" event being observed
 * by Audit Logs/Notifications/Analytics for a state change that didn't
 * actually happen.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _domainEvents: DomainEvent<any>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected addDomainEvent(event: DomainEvent<any>): void {
    this._domainEvents.push(event);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pullDomainEvents(): DomainEvent<any>[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}
