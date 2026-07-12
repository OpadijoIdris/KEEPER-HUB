import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { CorrelationContext } from './correlation-context';

const CORRELATION_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.header(CORRELATION_HEADER) as string) || randomUUID();
    res.setHeader(CORRELATION_HEADER, correlationId);
    CorrelationContext.run(correlationId, () => next());
  }
}
