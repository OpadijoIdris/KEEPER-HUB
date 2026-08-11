import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../../identity';
import type { AccessTokenClaims } from '../../../identity';
import { NotificationService } from '../../application/services/notification.service';
import { NotificationResponseDto, toNotificationResponse } from '../mappers/notification.mapper';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@CurrentUser() user: AccessTokenClaims): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationService.listByUser(user.sub);
    return notifications.map(toNotificationResponse);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AccessTokenClaims): Promise<{ count: number }> {
    const count = await this.notificationService.countUnread(user.sub);
    return { count };
  }

  @Post(':notificationId/read')
  async markRead(
    @CurrentUser() user: AccessTokenClaims,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationService.markRead(notificationId, user.sub);
    return toNotificationResponse(notification);
  }
}
