import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { CorrelationContext } from '../correlation/correlation-context';

/**
 * Structured logging (see docs/ARCHITECTURE.md §10.3). Every log line is
 * tagged with the current correlation ID automatically via the mixin, so no
 * call site has to remember to pass it. Secrets (wallet HMAC refs, API keys,
 * JWTs) are stripped by `redact`, centrally — never left to caller
 * discipline (§11.1).
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        mixin: () => ({ correlationId: CorrelationContext.get() }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.hmacSecret',
            '*.apiKey',
            '*.accessToken',
            '*.refreshToken',
          ],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
