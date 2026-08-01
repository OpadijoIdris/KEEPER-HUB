import { AgentWallet } from '../../domain/agent-wallet.entity';
import { PaymentAuthorization } from '../../domain/payment-authorization.entity';

export interface AgentWalletResponseDto {
  agentId: string;
  address: string;
  keeperHubIntegrationId: string;
  linkedAt: string;
}

export interface PaymentAuthorizationResponseDto {
  id: string;
  amount: string;
  asset: string;
  status: string;
  reason: string | null;
  decidedAt: string;
}

export function toAgentWalletResponse(wallet: AgentWallet): AgentWalletResponseDto {
  return {
    agentId: wallet.agentId,
    address: wallet.address,
    keeperHubIntegrationId: wallet.keeperHubIntegrationId,
    linkedAt: wallet.linkedAt.toISOString(),
  };
}

export function toPaymentAuthorizationResponse(
  authorization: PaymentAuthorization,
): PaymentAuthorizationResponseDto {
  return {
    id: authorization.id,
    amount: authorization.amount,
    asset: authorization.asset,
    status: authorization.status,
    reason: authorization.reason,
    decidedAt: authorization.decidedAt.toISOString(),
  };
}
