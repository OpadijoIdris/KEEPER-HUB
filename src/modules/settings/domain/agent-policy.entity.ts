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
  ) {
    super(id);
  }

  get spendLimit(): string {
    return this._spendLimit;
  }

  get allowedActions(): readonly string[] {
    return this._allowedActions;
  }

  static createDefault(agentId: string): AgentPolicy {
    // Deliberately conservative defaults — an agent can't spend or act
    // until someone explicitly widens its policy.
    return new AgentPolicy(randomUUID(), agentId, '0', []);
  }

  static fromPersistence(
    id: string,
    agentId: string,
    spendLimit: string,
    allowedActions: string[],
  ): AgentPolicy {
    return new AgentPolicy(id, agentId, spendLimit, allowedActions);
  }

  update(spendLimit?: string, allowedActions?: string[]): void {
    if (spendLimit !== undefined) this._spendLimit = spendLimit;
    if (allowedActions !== undefined) this._allowedActions = allowedActions;
  }

  /**
   * cumulativeSpendSoFar is the agent's already-authorized total (summed by
   * Wallet, the module that owns PaymentAuthorization — Settings is a pure
   * Open Host Service and doesn't reach into other modules' data itself).
   * Checked against spendLimit as a running budget, not a per-transaction
   * cap: a policy of 0.01 permits ten 0.001 transfers, not unlimited ones.
   */
  permits(kind: string, amount: string, cumulativeSpendSoFar: number): boolean {
    if (!this._allowedActions.includes(kind)) return false;
    return cumulativeSpendSoFar + Number(amount) <= Number(this._spendLimit);
  }
}
