import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';

/**
 * Not a Turnkey-provisioned wallet we create — links an agentId to the
 * org's existing KeeperHub wallet integration (see ROADMAP.md "KeeperHub
 * live API reconnaissance"). Every agent currently shares the same
 * underlying address; this record exists for per-agent audit linkage, not
 * because each agent has a distinct wallet.
 */
export class AgentWallet extends Entity<string> {
  private constructor(
    id: string,
    readonly agentId: string,
    readonly address: string,
    readonly keeperHubIntegrationId: string,
    readonly linkedAt: Date,
  ) {
    super(id);
  }

  static link(agentId: string, address: string, keeperHubIntegrationId: string): AgentWallet {
    return new AgentWallet(randomUUID(), agentId, address, keeperHubIntegrationId, new Date());
  }

  static fromPersistence(
    id: string,
    agentId: string,
    address: string,
    keeperHubIntegrationId: string,
    linkedAt: Date,
  ): AgentWallet {
    return new AgentWallet(id, agentId, address, keeperHubIntegrationId, linkedAt);
  }
}
