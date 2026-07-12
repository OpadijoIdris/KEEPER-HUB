import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { UserPreferencesRepository } from '../../domain/ports/user-preferences.repository';
import { UserPreferences } from '../../domain/user-preferences.entity';
import { Timezone } from '../../domain/value-objects/timezone.vo';
import { NotificationPreference } from '../../domain/value-objects/notification-preference.vo';
import type { UserPreferencesModel } from '../../../../generated/prisma/models';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class PrismaUserPreferencesRepository implements UserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const record = await this.prisma.userPreferences.findUnique({ where: { userId } });
    return record ? this.toDomain(record) : null;
  }

  async save(preferences: UserPreferences): Promise<void> {
    await this.prisma.userPreferences.upsert({
      where: { userId: preferences.userId },
      create: {
        id: preferences.id,
        userId: preferences.userId,
        notificationPreferences: [
          ...preferences.notificationPreferences,
        ] as unknown as Prisma.InputJsonValue,
        timezone: preferences.timezone.value,
      },
      update: {
        notificationPreferences: [
          ...preferences.notificationPreferences,
        ] as unknown as Prisma.InputJsonValue,
        timezone: preferences.timezone.value,
      },
    });
  }

  private toDomain(record: UserPreferencesModel): UserPreferences {
    return UserPreferences.fromPersistence(
      record.id,
      record.userId,
      record.notificationPreferences as unknown as NotificationPreference[],
      Timezone.create(record.timezone),
    );
  }
}
