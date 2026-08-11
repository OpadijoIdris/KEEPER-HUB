import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../domain/notification.entity';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/notification.repository';
import type { NotificationRepository } from '../../domain/ports/notification.repository';
import { EMAIL_PORT } from '../../domain/ports/email.port';
import type { EmailPort } from '../../domain/ports/email.port';
import { ForbiddenError, NotFoundError } from '../../../../shared/domain/domain-error.base';
import { UserPreferencesService } from '../../../settings';
import { AuthService } from '../../../identity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly authService: AuthService,
  ) {}

  /**
   * The one thing this module currently reacts to — see
   * notification.entity.ts's NotificationType comment. Always creates the
   * in-app record; only emails if the user's email channel is enabled.
   */
  async notifyExecutionCompleted(
    userId: string,
    agentName: string,
    transactionHash?: string,
  ): Promise<void> {
    const title = `${agentName} completed an execution`;
    const message = transactionHash
      ? `Your agent "${agentName}" successfully executed an on-chain transaction (${transactionHash}).`
      : `Your agent "${agentName}" successfully completed an execution.`;

    const notification = Notification.create(
      userId,
      'keeperhub.execution.completed',
      title,
      message,
    );
    await this.notifications.save(notification);

    const preferences = await this.userPreferencesService.get(userId);
    const emailEnabled = preferences.notificationPreferences.some(
      (pref) => pref.channel === 'email' && pref.enabled,
    );
    if (!emailEnabled) return;

    const recipient = await this.authService.getUserEmail(userId);
    if (!recipient) return;

    try {
      await this.email.send(recipient, title, message);
    } catch (error) {
      // Delivery failure shouldn't fail the execution flow that triggered
      // this — the in-app notification above already succeeded regardless.
      this.logger.warn(
        `Failed to email ${recipient}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async listByUser(userId: string, limit?: number): Promise<Notification[]> {
    return this.notifications.findByUserId(userId, limit);
  }

  async countUnread(userId: string): Promise<number> {
    return this.notifications.countUnread(userId);
  }

  async markRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notifications.findById(notificationId);
    if (!notification) throw new NotFoundError(`Notification "${notificationId}" not found.`);
    if (notification.userId !== userId) {
      throw new ForbiddenError('You may only mark your own notifications as read.');
    }
    notification.markRead();
    await this.notifications.save(notification);
    return notification;
  }
}
