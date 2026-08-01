import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface PaymentRejectedPayload extends Record<string, unknown> {
  agentWalletId: string;
  agentId: string;
  amount: string;
  asset: string;
  reason: string;
}

export class PaymentRejectedEvent extends DomainEvent<PaymentRejectedPayload> {
  readonly eventType = 'wallet.payment.rejected';
  readonly schemaVersion = 1;
}
