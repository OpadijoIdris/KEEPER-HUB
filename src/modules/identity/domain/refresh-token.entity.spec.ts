import { RefreshToken } from './refresh-token.entity';

describe('RefreshToken', () => {
  it('a freshly issued token is valid', () => {
    const token = RefreshToken.issue('user-1', 'hash', new Date(Date.now() + 60_000));
    expect(token.isValid()).toBe(true);
  });

  it('an expired token is invalid', () => {
    const token = RefreshToken.issue('user-1', 'hash', new Date(Date.now() - 1));
    expect(token.isValid()).toBe(false);
  });

  it('a revoked token is invalid even before its expiry', () => {
    const token = RefreshToken.issue('user-1', 'hash', new Date(Date.now() + 60_000));
    token.revoke();
    expect(token.isValid()).toBe(false);
  });
});
