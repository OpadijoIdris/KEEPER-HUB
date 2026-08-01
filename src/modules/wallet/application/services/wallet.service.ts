import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentWallet } from '../../domain/agent-wallet.entity';
import { PaymentAuthorization } from '../../domain/payment-authorization.entity';
import { AGENT_WALLET_REPOSITORY } from '../../domain/ports/agent-wallet.repository';
import type { AgentWalletRepository } from '../../domain/ports/agent-wallet.repository';
import { PAYMENT_AUTHORIZATION_REPOSITORY } from '../../domain/ports/payment-authorization.repository';
import type { PaymentAuthorizationRepository } from '../../domain/ports/payment-authorization.repository';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import type { AppConfig } from '../../../../config/configuration';

@Injectable()
export class WalletService {
  constructor(
    @Inject(AGENT_WALLET_REPOSITORY) private readonly wallets: AgentWalletRepository,
    @Inject(PAYMENT_AUTHORIZATION_REPOSITORY)
    private readonly authorizations: PaymentAuthorizationRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /** Idempotent — returns the existing link for this agent, or creates one against the org's configured KeeperHub wallet. */
  async getOrLinkWallet(agentId: string): Promise<AgentWallet> {
    const existing = await this.wallets.findByAgentId(agentId);
    if (existing) return existing;

    const address = this.configService.get('keeperHub.walletAddress', { infer: true });
    const integrationId = this.configService.get('keeperHub.walletIntegrationId', { infer: true });
    if (!address || !integrationId) {
      throw new Error(
        'KEEPERHUB_WALLET_ADDRESS / KEEPERHUB_WALLET_INTEGRATION_ID are not configured.',
      );
    }

    const wallet = AgentWallet.link(agentId, address, integrationId);
    await this.wallets.save(wallet);
    return wallet;
  }

  /**
   * Always authorizes for now — see PaymentAuthorization's class doc.
   * Spend-limit enforcement against AgentPolicy wires in on Day 3.
   */
  async authorizePayment(
    agentId: string,
    amount: string,
    asset: string,
  ): Promise<PaymentAuthorization> {
    const wallet = await this.getOrLinkWallet(agentId);
    const authorization = PaymentAuthorization.authorize(wallet.id, agentId, amount, asset);
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
