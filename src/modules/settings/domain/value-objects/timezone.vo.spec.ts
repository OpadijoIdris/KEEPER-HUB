import { Timezone } from './timezone.vo';
import { ValidationError } from '../../../../shared/domain/domain-error.base';

describe('Timezone', () => {
  it('accepts a real IANA timezone', () => {
    expect(Timezone.create('America/New_York').value).toBe('America/New_York');
  });

  it('rejects an unrecognized timezone', () => {
    expect(() => Timezone.create('Mars/Olympus_Mons')).toThrow(ValidationError);
  });

  it('defaults to UTC', () => {
    expect(Timezone.default().value).toBe('UTC');
  });

  it('accepts "UTC" via create() too — regression: default() must round-trip through persistence', () => {
    // Node's Intl.supportedValuesOf('timeZone') doesn't enumerate "UTC" on
    // every ICU build; without the explicit exception in create(), a stored
    // default timezone can never be read back (findByUserId always calls
    // Timezone.create(record.timezone)) and every fresh user's
    // GET /users/:id/preferences 400s forever.
    expect(Timezone.create('UTC').value).toBe('UTC');
  });
});
