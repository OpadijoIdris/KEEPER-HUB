import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from './shared/infrastructure/logger/logger.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { EventBusModule } from './shared/application/event-bus.module';
import { CorrelationMiddleware } from './shared/infrastructure/correlation/correlation.middleware';
import { IdentityModule } from './modules/identity';
import { SettingsModule } from './modules/settings';
import { AuditLogsModule } from './modules/audit-logs';
import { HealthMonitoringModule } from './modules/health-monitoring';
import { WalletModule } from './modules/wallet';
import { KeeperHubIntegrationModule } from './modules/keeperhub-integration';
import { AiModule } from './modules/ai';
import { NotificationsModule } from './modules/notifications';
import { AnalyticsModule } from './modules/analytics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    LoggerModule,
    PrismaModule,
    EventBusModule,
    // Bounded-context modules (docs/ARCHITECTURE.md §3). Each is filled in
    // one feature at a time per ROADMAP.md Phase 2 — empty scaffolds for now.
    IdentityModule,
    SettingsModule,
    AuditLogsModule,
    HealthMonitoringModule,
    WalletModule,
    KeeperHubIntegrationModule,
    AiModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
