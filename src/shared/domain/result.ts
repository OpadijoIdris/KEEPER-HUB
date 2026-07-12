/**
 * Explicit success/failure type for application-service return values, so
 * expected failure paths (validation, policy rejection, not-found) are part
 * of a method's signature instead of a thrown exception the caller must know
 * to catch. Reserve thrown errors for truly exceptional/unexpected failures.
 */
export class Result<T, E> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static fail<T = never, E = unknown>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot read the value of a failed Result.');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot read the error of a successful Result.');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this._isSuccess ? Result.ok(fn(this._value as T)) : Result.fail(this._error as E);
  }
}
