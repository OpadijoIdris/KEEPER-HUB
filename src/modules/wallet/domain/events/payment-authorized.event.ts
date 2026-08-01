import { DomainEvent } from '../../../../shared/domain/domain-event.base';

interface PaymentAuthorizedPayload extends Record<string, unknown> {
  agentWalletId: string;
  agentId: string;
  amount: string;
  asset: string;
}

export class PaymentAuthorizedEvent extends DomainEvent<PaymentAuthorizedPayload> {
  readonly eventType = 'wallet.payment.authorized';
  readonly schemaVersion = 1;
}
