import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/user.entity';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PlaintextPassword } from '../../domain/value-objects/plaintext-password.vo';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../domain/errors/identity.errors';
import { USER_REPOSITORY } from '../../domain/ports/user.repository';
import type { UserRepository } from '../../domain/ports/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TOKEN_ISSUER } from '../../domain/ports/token-issuer.port';
import type { TokenIssuer } from '../../domain/ports/token-issuer.port';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_REFRESH_TTL default

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuer,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async register(rawEmail: string, rawPassword: string): Promise<AuthTokens> {
    const email = Email.create(rawEmail);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError(email.value);
    }

    const password = PlaintextPassword.create(rawPassword);
    const passwordHash = await this.passwordHasher.hash(password);
    const user = User.register(email, passwordHash);

    await this.users.save(user);
    await this.publishEvents(user);

    return this.issueTokens(user);
  }

  async login(rawEmail: string, rawPassword: string): Promise<AuthTokens> {
    const email = Email.create(rawEmail);
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const password = PlaintextPassword.create(rawPassword);
    const matches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!matches) {
      throw new InvalidCredentialsError();
    }

    return this.issueTokens(user);
  }

  async refresh(presentedRefreshToken: string): Promise<AuthTokens> {
    const hash = this.tokenIssuer.hashRefreshToken(presentedRefreshToken);
    const stored = await this.refreshTokens.findByTokenHash(hash);
    if (!stored || !stored.isValid()) {
      throw new InvalidRefreshTokenError();
    }

    // Rotate: the presented token is single-use — revoke it before issuing a
    // replacement, so a leaked-then-replayed refresh token is rejected.
    stored.revoke();
    await this.refreshTokens.save(stored);

    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    return this.issueTokens(user);
  }

  /** Notifications' Public API consumer — resolves a userId to a deliverable address before emailing. */
  async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.users.findById(userId);
    return user ? user.email.value : null;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = this.tokenIssuer.signAccessToken({ sub: user.id, role: user.role });

    const { plaintext, hash } = this.tokenIssuer.generateRefreshToken();
    const refreshToken = RefreshToken.issue(
      user.id,
      hash,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    );
    await this.refreshTokens.save(refreshToken);

    return { accessToken, refreshToken: plaintext };
  }

  private async publishEvents(user: User): Promise<void> {
    for (const event of user.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
