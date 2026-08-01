import { Global, Module } from '@nestjs/common';
import { DomainEvent } from '../domain/domain-event.base';
import { DomainEventHandler, EVENT_BUS_PORT, EventBusPort } from './event-bus.port';

/**
 * In-process pub/sub (see docs/ARCHITECTURE.md §1.1, §9.3). A handler that
 * throws never propagates back to the publisher — KeeperHub Integration
 * completing an execution must never fail because Analytics' projection
 * threw. Failed deliveries are logged and counted as dead letters instead of
 * silently dropped; a *persistent* dead-letter store (vs. this in-memory
 * array) is still a future item, deliberately kept separate from Audit
 * Logs — "a subscriber failed to process an event" is a bus-level
 * operational concern, not the same thing as "this event happened".
 */
export class InProcessEventBus implements EventBusPort {
  private readonly handlers = new Map<string, DomainEventHandler[]>();
  private readonly wildcardHandlers: DomainEventHandler[] = [];
  private readonly deadLetters: Array<{
    event: DomainEvent<Record<string, unknown>>;
    error: unknown;
  }> = [];

  subscribe(eventType: string, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  subscribeToAll(handler: DomainEventHandler): void {
    this.wildcardHandlers.push(handler);
  }

  async publish(event: DomainEvent<Record<string, unknown>>): Promise<void> {
    const handlers = [...(this.handlers.get(event.eventType) ?? []), ...this.wildcardHandlers];
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.deadLetters.push({ event, error });
        }
      }),
    );
  }

  getDeadLetters(): ReadonlyArray<{ event: DomainEvent<Record<string, unknown>>; error: unknown }> {
    return this.deadLetters;
  }
}

@Global()
@Module({
  providers: [{ provide: EVENT_BUS_PORT, useClass: InProcessEventBus }],
  exports: [EVENT_BUS_PORT],
})
export class EventBusModule {}
