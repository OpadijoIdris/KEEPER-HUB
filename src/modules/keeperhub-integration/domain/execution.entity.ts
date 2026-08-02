import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { CorrelationContext } from '../../../shared/infrastructure/correlation/correlation-context';
import { ExecutionSubmittedEvent } from './events/execution-submitted.event';
import { ExecutionFailedEvent } from './events/execution-failed.event';
import { ExecutionCompletedEvent } from './events/execution-completed.event';

export type ExecutionKind = 'transfer' | 'protocol_action';
export type ExecutionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

/**
 * One attempt to execute something via KeeperHub. `id` doubles as the
 * idempotency key passed to KeeperHub's execute_* tools (see
 * ROADMAP.md "KeeperHub live API reconnaissance") — a retried call with
 * the same id+args returns the original result instead of re-executing.
 */
export class Execution extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly agentId: string,
    readonly kind: ExecutionKind,
    readonly params: Record<string, unknown>,
    private _status: ExecutionStatus,
    private _keeperHubExecutionId: string | null,
    private _transactionHash: string | null,
    private _failureReason: string | null,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  get status(): ExecutionStatus {
    return this._status;
  }

  get keeperHubExecutionId(): string | null {
    return this._keeperHubExecutionId;
  }

  get transactionHash(): string | null {
    return this._transactionHash;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  static create(agentId: string, kind: ExecutionKind, params: Record<string, unknown>): Execution {
    return new Execution(
      randomUUID(),
      agentId,
      kind,
      params,
      'pending',
      null,
      null,
      null,
      new Date(),
    );
  }

  static fromPersistence(
    id: string,
    agentId: string,
    kind: ExecutionKind,
    params: Record<string, unknown>,
    status: ExecutionStatus,
    keeperHubExecutionId: string | null,
    transactionHash: string | null,
    failureReason: string | null,
    createdAt: Date,
  ): Execution {
    return new Execution(
      id,
      agentId,
      kind,
      params,
      status,
      keeperHubExecutionId,
      transactionHash,
      failureReason,
      createdAt,
    );
  }

  markSubmitted(keeperHubExecutionId: string): void {
    this._status = 'submitted';
    this._keeperHubExecutionId = keeperHubExecutionId;
    this.addDomainEvent(
      new ExecutionSubmittedEvent({
        correlationId: CorrelationContext.get(),
        payload: {
          agentId: this.agentId,
          keeperHubExecutionId,
          kind: this.kind,
          params: this.params,
        },
        subject: { type: 'Execution', id: this.id },
      }),
    );
  }

  /** Never got a keeperHubExecutionId — the submission attempt itself failed (see §8.3-style distinction). */
  markFailed(reason: string): void {
    this._status = 'failed';
    this._failureReason = reason;
    this.addDomainEvent(
      new ExecutionFailedEvent({
        correlationId: CorrelationContext.get(),
        payload: { agentId: this.agentId, reason },
        subject: { type: 'Execution', id: this.id },
        severity: 'warning',
      }),
    );
  }

  markConfirmed(transactionHash?: string, result?: unknown): void {
    this._status = 'confirmed';
    this._transactionHash = transactionHash ?? null;
    this.addDomainEvent(
      new ExecutionCompletedEvent({
        correlationId: CorrelationContext.get(),
        payload: { agentId: this.agentId, transactionHash, result },
        subject: { type: 'Execution', id: this.id },
      }),
    );
  }

  /** Had a keeperHubExecutionId, then the on-chain transaction itself failed — distinguishable from markFailed in the audit trail. */
  markReverted(reason: string): void {
    this._status = 'failed';
    this._failureReason = reason;
    this.addDomainEvent(
      new ExecutionFailedEvent({
        correlationId: CorrelationContext.get(),
        payload: { agentId: this.agentId, reason },
        subject: { type: 'Execution', id: this.id },
        severity: 'warning',
      }),
    );
  }
}
