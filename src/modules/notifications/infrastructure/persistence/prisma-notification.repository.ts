import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { NotificationRepository } from '../../domain/ports/notification.repository';
import { Notification, NotificationType } from '../../domain/notification.entity';
import type { NotificationModel } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<void> {
    await this.prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
      },
      update: {
        read: notification.read,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map((record) => this.toDomain(record));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  private toDomain(record: NotificationModel): Notification {
    return Notification.fromPersistence(
      record.id,
      record.userId,
      record.type as NotificationType,
      record.title,
      record.message,
      record.read,
      record.createdAt,
    );
  }
}
