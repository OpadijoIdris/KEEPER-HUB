import { ValidationError } from '../../../../shared/domain/domain-error.base';

/**
 * Wraps an already-hashed password. Hashing/comparison is an algorithmic
 * concern (bcrypt), so it lives behind PasswordHasherPort in
 * infrastructure/security — this VO only guards that the domain never holds
 * a plaintext password or an empty/malformed hash.
 */
export class PasswordHash {
  private constructor(readonly value: string) {}

  static fromHash(hash: string): PasswordHash {
    if (!hash) {
      throw new ValidationError('Password hash cannot be empty.');
    }
    return new PasswordHash(hash);
  }
}
