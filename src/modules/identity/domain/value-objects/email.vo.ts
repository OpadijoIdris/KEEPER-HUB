import { ValidationError } from '../../../../shared/domain/domain-error.base';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes (lowercase, trimmed) and validates shape at construction —
 * enforced here, not just at the HTTP boundary, so it holds regardless of
 * entry point (see docs/ARCHITECTURE.md §6.3).
 */
export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError(`"${raw}" is not a valid email address.`);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
