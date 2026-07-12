import { AuthService } from './auth.service';
import { User } from '../../domain/user.entity';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import type { PlaintextPassword } from '../../domain/value-objects/plaintext-password.vo';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../domain/errors/identity.errors';
import type { UserRepository } from '../../domain/ports/user.repository';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { AccessTokenClaims, TokenIssuer } from '../../domain/ports/token-issuer.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import type { DomainEvent } from '../../../../shared/domain/domain-event.base';

class FakeUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.byId.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.byId.set(user.id, user);
  }
}

class FakeRefreshTokenRepository implements RefreshTokenRepository {
  private readonly byHash = new Map<string, RefreshToken>();

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.byHash.get(tokenHash) ?? null;
  }

  async save(token: RefreshToken): Promise<void> {
    this.byHash.set(token.tokenHash, token);
  }
}

/** Trivial reversible "hash" — good enough for exercising compare logic in tests. */
class FakePasswordHasher implements PasswordHasher {
  async hash(password: PlaintextPassword): Promise<PasswordHash> {
    return PasswordHash.fromHash(`hashed:${password.value}`);
  }

  async compare(password: PlaintextPassword, hash: PasswordHash): Promise<boolean> {
    return hash.value === `hashed:${password.value}`;
  }
}

class FakeTokenIssuer implements TokenIssuer {
  private counter = 0;

  signAccessToken(claims: AccessTokenClaims): string {
    return `access:${claims.sub}`;
  }

  verifyAccessToken(): AccessTokenClaims | null {
    return null;
  }

  generateRefreshToken(): { plaintext: string; hash: string } {
    this.counter += 1;
    const plaintext = `refresh-plaintext-${this.counter}`;
    return { plaintext, hash: this.hashRefreshToken(plaintext) };
  }

  hashRefreshToken(plaintext: string): string {
    return `hashed:${plaintext}`;
  }
}

class FakeEventBus implements EventBusPort {
  readonly published: DomainEvent<Record<string, unknown>>[] = [];

  async publish(event: DomainEvent<Record<string, unknown>>): Promise<void> {
    this.published.push(event);
  }

  subscribe(): void {}
}

function buildService() {
  const users = new FakeUserRepository();
  const refreshTokens = new FakeRefreshTokenRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenIssuer = new FakeTokenIssuer();
  const eventBus = new FakeEventBus();

  const service = new AuthService(users, refreshTokens, passwordHasher, tokenIssuer, eventBus);
  return { service, users, refreshTokens, eventBus };
}

describe('AuthService', () => {
  it('register creates a user, issues tokens, and publishes UserRegisteredEvent', async () => {
    const { service, eventBus } = buildService();

    const tokens = await service.register('frank@example.com', 'correcthorsebattery');

    expect(tokens.accessToken).toContain('access:');
    expect(tokens.refreshToken).toContain('refresh-plaintext-');
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventType).toBe('identity.user.registered');
  });

  it('register rejects a duplicate email', async () => {
    const { service } = buildService();
    await service.register('grace@example.com', 'correcthorsebattery');

    await expect(service.register('grace@example.com', 'anotherpassword')).rejects.toThrow(
      EmailAlreadyInUseError,
    );
  });

  it('login succeeds with correct credentials', async () => {
    const { service } = buildService();
    await service.register('heidi@example.com', 'correcthorsebattery');

    const tokens = await service.login('heidi@example.com', 'correcthorsebattery');
    expect(tokens.accessToken).toContain('access:');
  });

  it('login rejects an unknown email', async () => {
    const { service } = buildService();
    await expect(service.login('nobody@example.com', 'whatever123')).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('login rejects the wrong password', async () => {
    const { service } = buildService();
    await service.register('ivan@example.com', 'correcthorsebattery');

    await expect(service.login('ivan@example.com', 'wrongpassword')).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('refresh rotates the token: old one stops working, new one is issued', async () => {
    const { service, refreshTokens } = buildService();
    const initial = await service.register('judy@example.com', 'correcthorsebattery');

    const rotated = await service.refresh(initial.refreshToken);
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);

    // The original refresh token was revoked on rotation — reusing it must fail.
    await expect(service.refresh(initial.refreshToken)).rejects.toThrow(InvalidRefreshTokenError);

    const original = await refreshTokens.findByTokenHash(`hashed:${initial.refreshToken}`);
    expect(original?.isValid()).toBe(false);
  });

  it('refresh rejects an unknown token', async () => {
    const { service } = buildService();
    await expect(service.refresh('never-issued')).rejects.toThrow(InvalidRefreshTokenError);
  });
});
