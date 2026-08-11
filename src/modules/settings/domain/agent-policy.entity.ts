import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';

/**
 * One per agent, created lazily on first read (same idempotent-link
 * pattern as Wallet's AgentWallet). The actual spend-limit/allowed-action
 * enforcement lives in Wallet.authorizePayment, which reads this via
 * Settings' Public API — Settings doesn't call out to anyone, it's a pure
 * Open Host Service (docs/ARCHITECTURE.md §5.1, §7.3).
 */
export class AgentPolicy extends Entity<string> {
  private constructor(
    id: string,
    readonly agentId: string,
    private _spendLimit: string,
    private _allowedActions: string[],
    private _allowedDestinations: string[],
  ) {
    super(id);
  }

  get spendLimit(): string {
    return this._spendLimit;
  }

  get allowedActions(): readonly string[] {
    return this._allowedActions;
  }

  get allowedDestinations(): readonly string[] {
    return this._allowedDestinations;
  }

  static createDefault(agentId: string): AgentPolicy {
    // Deliberately conservative defaults — an agent can't spend or act
    // until someone explicitly widens its policy. allowedDestinations is
    // the exception: empty means "unrestricted", not "blocked" (see
    // permits()) — restricting destinations is opt-in, not a fresh
    // migration-breaking default for every existing agent.
    return new AgentPolicy(randomUUID(), agentId, '0', [], []);
  }

  static fromPersistence(
    id: string,
    agentId: string,
    spendLimit: string,
    allowedActions: string[],
    allowedDestinations: string[],
  ): AgentPolicy {
    return new AgentPolicy(id, agentId, spendLimit, allowedActions, allowedDestinations);
  }

  update(spendLimit?: string, allowedActions?: string[], allowedDestinations?: string[]): void {
    if (spendLimit !== undefined) this._spendLimit = spendLimit;
    if (allowedActions !== undefined) this._allowedActions = allowedActions;
    if (allowedDestinations !== undefined) this._allowedDestinations = allowedDestinations;
  }

  /**
   * cumulativeSpendSoFar is the agent's already-authorized total (summed by
   * Wallet, the module that owns PaymentAuthorization — Settings is a pure
   * Open Host Service and doesn't reach into other modules' data itself).
   * Checked against spendLimit as a running budget, not a per-transaction
   * cap: a policy of 0.01 permits ten 0.001 transfers, not unlimited ones.
   *
   * destinationAddress is only checked for 'transfer' — other action kinds
   * (e.g. protocol_action) have no first-class destination field. An empty
   * allowedDestinations list means unrestricted (fail-open by design, so
   * this doesn't retroactively block every agent that predates the field).
   */
  permits(
    kind: string,
    amount: string,
    cumulativeSpendSoFar: number,
    destinationAddress?: string,
  ): boolean {
    if (!this._allowedActions.includes(kind)) return false;
    if (kind === 'transfer' && this._allowedDestinations.length > 0 && destinationAddress) {
      const allowed = this._allowedDestinations.some(
        (address) => address.toLowerCase() === destinationAddress.toLowerCase(),
      );
      if (!allowed) return false;
    }
    return cumulativeSpendSoFar + Number(amount) <= Number(this._spendLimit);
  }
}
