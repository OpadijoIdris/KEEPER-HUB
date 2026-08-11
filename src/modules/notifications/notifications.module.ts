import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings';
import { IdentityModule } from '../identity';
import { NotificationService } from './application/services/notification.service';
import { NotificationController } from './interface/http/notification.controller';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { NodemailerEmailAdapter } from './infrastructure/external/nodemailer-email.adapter';
import { NotificationEventSubscriber } from './infrastructure/events/notification-event.subscriber';
import { NOTIFICATION_REPOSITORY } from './domain/ports/notification.repository';
import { EMAIL_PORT } from './domain/ports/email.port';

/**
 * Bounded context: Notifications (docs/ARCHITECTURE.md §3, §4.7, §5.7).
 * Reacts to keeperhub.execution.completed via the shared event bus (see
 * NotificationEventSubscriber) rather than being called directly by
 * KeeperHub Integration — stays decoupled the same way Audit Logs does.
 * Imports SettingsModule (email channel preference) and IdentityModule
 * (resolving userId -> email address); AgentService comes from the
 * globally-registered AiModule, no import needed.
 */
@Module({
  imports: [SettingsModule, IdentityModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationEventSubscriber,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: EMAIL_PORT, useClass: NodemailerEmailAdapter },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
