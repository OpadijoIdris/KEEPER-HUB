import { ValidationError } from '../../../../shared/domain/domain-error.base';

const MIN_LENGTH = 10;

/**
 * A validated, not-yet-hashed password — exists transiently during
 * registration/login only, never persisted or logged. Minimum-length policy
 * is a domain rule (enforced here, at construction) independent of the
 * hashing algorithm, which is an infrastructure concern.
 */
export class PlaintextPassword {
  private constructor(readonly value: string) {}

  static create(raw: string): PlaintextPassword {
    if (raw.length < MIN_LENGTH) {
      throw new ValidationError(`Password must be at least ${MIN_LENGTH} characters.`);
    }
    return new PlaintextPassword(raw);
  }
}
