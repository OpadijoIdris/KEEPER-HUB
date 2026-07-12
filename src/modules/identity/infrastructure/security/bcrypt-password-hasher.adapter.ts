import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import { PlaintextPassword } from '../../domain/value-objects/plaintext-password.vo';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: PlaintextPassword): Promise<PasswordHash> {
    const hash = await bcrypt.hash(password.value, SALT_ROUNDS);
    return PasswordHash.fromHash(hash);
  }

  async compare(password: PlaintextPassword, hash: PasswordHash): Promise<boolean> {
    return bcrypt.compare(password.value, hash.value);
  }
}
