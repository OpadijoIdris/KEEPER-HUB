import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { CorrelationContext } from '../../../shared/infrastructure/correlation/correlation-context';
import { PaymentAuthorizedEvent } from './events/payment-authorized.event';
import { PaymentRejectedEvent } from './events/payment-rejected.event';

export type PaymentAuthorizationStatus = 'authorized' | 'rejected';

/**
 * Audit record of an authorization decision, not a payment execution
 * itself (KeeperHub Integration executes; this module only decides
 * "is this agent allowed to spend this"). Spend-limit/allowed-action
 * enforcement against AgentPolicy is wired in (Day 3, ROADMAP.md Phase
 * 2.1b) — the application layer (WalletService) loads the policy and
 * decides authorize vs reject before constructing this record.
 */
export class PaymentAuthorization extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly agentWalletId: string,
    readonly agentId: string,
    readonly kind: string,
    readonly amount: string,
    readonly asset: string,
    readonly status: PaymentAuthorizationStatus,
    readonly reason: string | null,
    readonly decidedAt: Date,
  ) {
    super(id);
  }

  static authorize(
    agentWalletId: string,
    agentId: string,
    kind: string,
    amount: string,
    asset: string,
  ): PaymentAuthorization {
    const authorization = new PaymentAuthorization(
      randomUUID(),
      agentWalletId,
      agentId,
      kind,
      amount,
      asset,
      'authorized',
      null,
      new Date(),
    );
    authorization.addDomainEvent(
      new PaymentAuthorizedEvent({
        correlationId: CorrelationContext.get(),
        payload: { agentWalletId, agentId, amount, asset },
        subject: { type: 'AgentWallet', id: agentWalletId },
      }),
    );
    return authorization;
  }

  static reject(
    agentWalletId: string,
    agentId: string,
    kind: string,
    amount: string,
    asset: string,
    reason: string,
  ): PaymentAuthorization {
    const authorization = new PaymentAuthorization(
      randomUUID(),
      agentWalletId,
      agentId,
      kind,
      amount,
      asset,
      'rejected',
      reason,
      new Date(),
    );
    authorization.addDomainEvent(
      new PaymentRejectedEvent({
        correlationId: CorrelationContext.get(),
        payload: { agentWalletId, agentId, amount, asset, reason },
        subject: { type: 'AgentWallet', id: agentWalletId },
        severity: 'warning',
      }),
    );
    return authorization;
  }

  static fromPersistence(
    id: string,
    agentWalletId: string,
    agentId: string,
    kind: string,
    amount: string,
    asset: string,
    status: PaymentAuthorizationStatus,
    reason: string | null,
    decidedAt: Date,
  ): PaymentAuthorization {
    return new PaymentAuthorization(
      id,
      agentWalletId,
      agentId,
      kind,
      amount,
      asset,
      status,
      reason,
      decidedAt,
    );
  }
}
