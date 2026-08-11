import { ValidationError } from '../../../../shared/domain/domain-error.base';

const VALID_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

/**
 * Validated against the real IANA timezone database (Node's Intl API), not a
 * hand-rolled list — with one deliberate exception. "UTC" is the universal,
 * unambiguous default every user recognizes, but Node's bundled ICU data
 * does not enumerate it under Intl.supportedValuesOf('timeZone') (verified:
 * it returns false, and there's no "Etc/UTC" alias in the list either on
 * this build). Without this exception, Timezone.default() produces a value
 * its own create() rejects — every user with an unset timezone would 400 on
 * their very first GET /users/:id/preferences, forever, since the stored
 * default can never be read back.
 */
export class Timezone {
  private constructor(readonly value: string) {}

  static create(raw: string): Timezone {
    if (raw !== 'UTC' && !VALID_TIMEZONES.has(raw)) {
      throw new ValidationError(`"${raw}" is not a recognized IANA timezone.`);
    }
    return new Timezone(raw);
  }

  static default(): Timezone {
    return new Timezone('UTC');
  }
}
