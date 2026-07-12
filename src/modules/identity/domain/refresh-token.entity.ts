import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';

/**
 * Not an AggregateRoot — purely a security record with no events to raise.
 * "Is this token still usable" is a real business rule (expiry + explicit
 * revocation on rotation), so it lives here rather than as a bare data shape
 * with the check scattered across application code.
 */
export class RefreshToken extends Entity<string> {
  private constructor(
    id: string,
    readonly userId: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    private _revokedAt: Date | null,
  ) {
    super(id);
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  static issue(userId: string, tokenHash: string, expiresAt: Date): RefreshToken {
    return new RefreshToken(randomUUID(), userId, tokenHash, expiresAt, null);
  }

  static fromPersistence(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    revokedAt: Date | null,
  ): RefreshToken {
    return new RefreshToken(id, userId, tokenHash, expiresAt, revokedAt);
  }

  isValid(now: Date = new Date()): boolean {
    return this._revokedAt === null && this.expiresAt > now;
  }

  revoke(): void {
    this._revokedAt = new Date();
  }
}
