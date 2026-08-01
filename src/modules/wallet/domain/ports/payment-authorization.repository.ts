import { PaymentAuthorization } from '../payment-authorization.entity';

export const PAYMENT_AUTHORIZATION_REPOSITORY = Symbol('PAYMENT_AUTHORIZATION_REPOSITORY');

export interface PaymentAuthorizationRepository {
  save(authorization: PaymentAuthorization): Promise<void>;
  findByAgentId(agentId: string): Promise<PaymentAuthorization[]>;
}
