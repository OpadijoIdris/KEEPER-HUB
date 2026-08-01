// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DomainEvent } from '../domain/domain-event.base';

export const EVENT_BUS_PORT = Symbol('EVENT_BUS_PORT');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DomainEventHandler = (event: DomainEvent<any>) => Promise<void> | void;

/**
 * The only way modules talk to each other by default (see
 * docs/ARCHITECTURE.md §1.1). Swapping the in-process implementation
 * (event-bus.module.ts) for a message-broker-backed one later — to extract a
 * module into its own deployable — never requires touching a publisher or
 * subscriber, only this binding.
 */
export interface EventBusPort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publish(event: DomainEvent<any>): Promise<void>;
  subscribe(eventType: string, handler: DomainEventHandler): void;
  /** Audit Logs' only subscription — every event, without a per-type registration. */
  subscribeToAll(handler: DomainEventHandler): void;
}
