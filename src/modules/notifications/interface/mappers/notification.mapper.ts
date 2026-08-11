import { Notification } from '../../domain/notification.entity';

export interface NotificationResponseDto {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function toNotificationResponse(notification: Notification): NotificationResponseDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}
