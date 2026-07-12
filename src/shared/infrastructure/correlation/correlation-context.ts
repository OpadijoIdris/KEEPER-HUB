import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface CorrelationStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

/**
 * Threads a correlation ID through every application-service call in a
 * request/job without passing it explicitly through every function
 * signature (see docs/ARCHITECTURE.md §10.1). Attach it to every published
 * DomainEvent and every log line so one agent decision's full story — audit
 * entries, logs, executions, notifications — is reconstructable by one ID.
 */
export const CorrelationContext = {
  run<T>(correlationId: string, fn: () => T): T {
    return storage.run({ correlationId }, fn);
  },

  runWithNewId<T>(fn: () => T): T {
    return storage.run({ correlationId: randomUUID() }, fn);
  },

  get(): string {
    return storage.getStore()?.correlationId ?? 'no-correlation-context';
  },
};
