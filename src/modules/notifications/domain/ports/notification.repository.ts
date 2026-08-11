import { Notification } from '../notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
}
