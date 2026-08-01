import { randomUUID } from 'crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import { CorrelationContext } from '../../../shared/infrastructure/correlation/correlation-context';
import { Email } from './value-objects/email.vo';
import { PasswordHash } from './value-objects/password-hash.vo';
import { UserRegisteredEvent } from './events/user-registered.event';

export type UserRole = 'user' | 'admin';

export class User extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly email: Email,
    private _passwordHash: PasswordHash,
    readonly role: UserRole,
    readonly createdAt: Date,
  ) {
    super(id);
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  static register(email: Email, passwordHash: PasswordHash): User {
    const user = new User(randomUUID(), email, passwordHash, 'user', new Date());
    user.addDomainEvent(
      new UserRegisteredEvent({
        correlationId: CorrelationContext.get(),
        payload: { userId: user.id, email: user.email.value },
        subject: { type: 'User', id: user.id },
      }),
    );
    return user;
  }

  /** Reconstructs from persisted state — no events raised, this isn't a new registration. */
  static fromPersistence(
    id: string,
    email: Email,
    passwordHash: PasswordHash,
    role: UserRole,
    createdAt: Date,
  ): User {
    return new User(id, email, passwordHash, role, createdAt);
  }
}
