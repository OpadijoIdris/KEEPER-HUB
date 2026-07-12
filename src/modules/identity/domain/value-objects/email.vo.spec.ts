import { Email } from './email.vo';
import { ValidationError } from '../../../../shared/domain/domain-error.base';

describe('Email', () => {
  it('normalizes casing and whitespace', () => {
    const email = Email.create('  Alice@Example.COM  ');
    expect(email.value).toBe('alice@example.com');
  });

  it('rejects a malformed address', () => {
    expect(() => Email.create('not-an-email')).toThrow(ValidationError);
  });

  it('two emails with the same normalized value are equal', () => {
    const a = Email.create('bob@example.com');
    const b = Email.create('BOB@example.com');
    expect(a.equals(b)).toBe(true);
  });
});
