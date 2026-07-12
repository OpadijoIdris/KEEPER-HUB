import { ConflictError, UnauthorizedError } from '../../../../shared/domain/domain-error.base';

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`An account with email "${email}" already exists.`);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    // Deliberately generic — never reveal whether the email or the password
    // was the one that didn't match (avoids leaking which emails are registered).
    super('Invalid email or password.');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super('Refresh token is invalid, expired, or already used.');
  }
}
