import { Inject, Injectable } from '@nestjs/common';
import { AgentWallet } from '../../domain/agent-wallet.entity';
import { PaymentAuthorization } from '../../domain/payment-authorization.entity';
import { AGENT_WALLET_REPOSITORY } from '../../domain/ports/agent-wallet.repository';
import type { AgentWalletRepository } from '../../domain/ports/agent-wallet.repository';
import { PAYMENT_AUTHORIZATION_REPOSITORY } from '../../domain/ports/payment-authorization.repository';
import type { PaymentAuthorizationRepository } from '../../domain/ports/payment-authorization.repository';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import { NotFoundError } from '../../../../shared/domain/domain-error.base';
import { AgentPolicyService } from '../../../settings';

@Injectable()
export class WalletService {
  constructor(
    @Inject(AGENT_WALLET_REPOSITORY) private readonly wallets: AgentWalletRepository,
    @Inject(PAYMENT_AUTHORIZATION_REPOSITORY)
    private readonly authorizations: PaymentAuthorizationRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly agentPolicyService: AgentPolicyService,
  ) {}

  /**
   * Explicit user action (README.md "Wallet model" — bring-your-own-wallet).
   * The caller connects a wallet to their own KeeperHub org's dashboard
   * first, then hands us the resulting address + integrationId. Upsert: a
   * second call re-points the agent at a different wallet rather than
   * erroring, since "I want to swap wallets" is a legitimate action.
   */
  async linkWallet(
    agentId: string,
    address: string,
    keeperHubIntegrationId: string,
  ): Promise<AgentWallet> {
    const existing = await this.wallets.findByAgentId(agentId);
    if (existing) {
      existing.relink(address, keeperHubIntegrationId);
      await this.wallets.save(existing);
      return existing;
    }

    const wallet = AgentWallet.link(agentId, address, keeperHubIntegrationId);
    await this.wallets.save(wallet);
    return wallet;
  }

  /** No fallback to a shared/default wallet — every agent must be explicitly linked (see linkWallet). */
  async getWallet(agentId: string): Promise<AgentWallet> {
    const wallet = await this.wallets.findByAgentId(agentId);
    if (!wallet) {
      throw new NotFoundError(
        `No wallet linked for agent "${agentId}" — link one via PATCH /agents/${agentId}/wallet first.`,
      );
    }
    return wallet;
  }

  /**
   * Checked against AgentPolicy (Settings' Public API — Wallet is the
   * consumer here, see docs/ARCHITECTURE.md §7.3, §9.2). Returns a
   * "rejected" PaymentAuthorization rather than throwing — an agent
   * exceeding its policy is an expected business outcome, not an
   * exceptional error, and the rejection itself is exactly the kind of
   * thing that belongs in the audit trail.
   */
  async authorizePayment(
    agentId: string,
    kind: string,
    amount: string,
    asset: string,
    destinationAddress?: string,
  ): Promise<PaymentAuthorization> {
    const wallet = await this.getWallet(agentId);
    const cumulativeSpendSoFar = await this.authorizations.sumAuthorizedAmount(agentId);
    const check = await this.agentPolicyService.permits(
      agentId,
      kind,
      amount,
      cumulativeSpendSoFar,
      destinationAddress,
    );

    const authorization = check.permitted
      ? PaymentAuthorization.authorize(wallet.id, agentId, kind, amount, asset)
      : PaymentAuthorization.reject(
          wallet.id,
          agentId,
          kind,
          amount,
          asset,
          `Agent policy rejected this "${kind}": ${check.reason}.`,
        );

    await this.authorizations.save(authorization);
    await this.publishEvents(authorization);
    return authorization;
  }

  async getAuthorizationHistory(agentId: string): Promise<PaymentAuthorization[]> {
    return this.authorizations.findByAgentId(agentId);
  }

  private async publishEvents(authorization: PaymentAuthorization): Promise<void> {
    for (const event of authorization.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
