import { Result } from './result';

describe('Result', () => {
  it('holds a value on success', () => {
    const result = Result.ok<number, string>(42);

    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.value).toBe(42);
  });

  it('holds an error on failure', () => {
    const result = Result.fail<number, string>('not found');

    expect(result.isFailure).toBe(true);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('not found');
  });

  it('throws when reading .value on a failed result', () => {
    const result = Result.fail<number, string>('boom');

    expect(() => result.value).toThrow();
  });

  it('throws when reading .error on a successful result', () => {
    const result = Result.ok<number, string>(1);

    expect(() => result.error).toThrow();
  });

  it('map transforms the value only on success', () => {
    const ok = Result.ok<number, string>(2).map((n) => n * 10);
    const fail = Result.fail<number, string>('boom').map((n) => n * 10);

    expect(ok.value).toBe(20);
    expect(fail.isFailure).toBe(true);
  });
});
