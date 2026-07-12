import { PlaintextPassword } from './plaintext-password.vo';
import { ValidationError } from '../../../../shared/domain/domain-error.base';

describe('PlaintextPassword', () => {
  it('accepts a password meeting the minimum length', () => {
    expect(PlaintextPassword.create('correcthorsebattery').value).toBe('correcthorsebattery');
  });

  it('rejects a password below the minimum length', () => {
    expect(() => PlaintextPassword.create('short')).toThrow(ValidationError);
  });
});
