import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/domain-error.base';
import { CorrelationContext } from '../../infrastructure/correlation/correlation-context';

/**
 * The one place a DomainError subclass is mapped to an HTTP status (see
 * docs/ARCHITECTURE.md §6.3) — no module writes its own try/catch-to-HTTP
 * mapping.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      correlationId: CorrelationContext.get(),
    });
  }

  private resolveStatus(exception: DomainError): number {
    if (exception instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ValidationError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof ConflictError) return HttpStatus.CONFLICT;
    if (exception instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
    if (exception instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
