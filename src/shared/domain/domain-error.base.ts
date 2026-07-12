/**
 * Base for every module's domain-specific errors. Thrown from domain/
 * application code; mapped to HTTP status codes exactly once, centrally, by
 * DomainExceptionFilter (see docs/ARCHITECTURE.md §6.3) — modules never
 * import Nest's HttpException.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}

/**
 * The caller's identity could not be established or verified (missing/
 * invalid/expired credentials) — distinct from ForbiddenError, which is for
 * an authenticated caller lacking permission for the thing they're asking for.
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
}
