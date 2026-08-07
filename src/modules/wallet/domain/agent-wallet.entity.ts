import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';

/**
 * Links an agentId to a KeeperHub wallet integration the agent's owner
 * connected themselves (see README.md "Wallet model" — we never hold
 * private key material; KeeperHub's dashboard is where a wallet actually
 * gets connected). One per agent, distinct per agent — not a shared
 * platform-wide wallet.
 */
export class AgentWallet extends Entity<string> {
  private constructor(
    id: string,
    readonly agentId: string,
    private _address: string,
    private _keeperHubIntegrationId: string,
    private _linkedAt: Date,
  ) {
    super(id);
  }

  get address(): string {
    return this._address;
  }

  get keeperHubIntegrationId(): string {
    return this._keeperHubIntegrationId;
  }

  get linkedAt(): Date {
    return this._linkedAt;
  }

  static link(agentId: string, address: string, keeperHubIntegrationId: string): AgentWallet {
    return new AgentWallet(randomUUID(), agentId, address, keeperHubIntegrationId, new Date());
  }

  /** Re-point this agent at a different wallet integration — same identity, new target. */
  relink(address: string, keeperHubIntegrationId: string): void {
    this._address = address;
    this._keeperHubIntegrationId = keeperHubIntegrationId;
    this._linkedAt = new Date();
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
