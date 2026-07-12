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
});
