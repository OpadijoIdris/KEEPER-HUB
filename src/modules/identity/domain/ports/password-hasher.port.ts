import { PasswordHash } from '../value-objects/password-hash.vo';
import { PlaintextPassword } from '../value-objects/plaintext-password.vo';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * External-capability port (see docs/ARCHITECTURE.md §5.0) — hashing is an
 * algorithm choice (bcryptjs today), never a domain concern.
 */
export interface PasswordHasher {
  hash(password: PlaintextPassword): Promise<PasswordHash>;
  compare(password: PlaintextPassword, hash: PasswordHash): Promise<boolean>;
}
