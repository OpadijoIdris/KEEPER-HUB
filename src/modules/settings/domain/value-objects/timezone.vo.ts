import { ValidationError } from '../../../../shared/domain/domain-error.base';

const VALID_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

/** Validated against the real IANA timezone database (Node's Intl API), not a hand-rolled list. */
export class Timezone {
  private constructor(readonly value: string) {}

  static create(raw: string): Timezone {
    if (!VALID_TIMEZONES.has(raw)) {
      throw new ValidationError(`"${raw}" is not a recognized IANA timezone.`);
    }
    return new Timezone(raw);
  }

  static default(): Timezone {
    return new Timezone('UTC');
  }
}
