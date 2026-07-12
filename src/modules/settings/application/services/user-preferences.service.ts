import { Inject, Injectable } from '@nestjs/common';
import { UserPreferences } from '../../domain/user-preferences.entity';
import { Timezone } from '../../domain/value-objects/timezone.vo';
import { NotificationChannel } from '../../domain/value-objects/notification-preference.vo';
import { USER_PREFERENCES_REPOSITORY } from '../../domain/ports/user-preferences.repository';
import type { UserPreferencesRepository } from '../../domain/ports/user-preferences.repository';

@Injectable()
export class UserPreferencesService {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly repository: UserPreferencesRepository,
  ) {}

  /** Returns sensible defaults without writing anything if the user never customized them. */
  async get(userId: string): Promise<UserPreferences> {
    return (await this.repository.findByUserId(userId)) ?? UserPreferences.createDefault(userId);
  }

  async update(
    userId: string,
    changes: {
      timezone?: string;
      notificationChannel?: { channel: NotificationChannel; enabled: boolean };
    },
  ): Promise<UserPreferences> {
    const preferences = await this.get(userId);

    if (changes.timezone) {
      preferences.updateTimezone(Timezone.create(changes.timezone));
    }
    if (changes.notificationChannel) {
      preferences.setChannelEnabled(
        changes.notificationChannel.channel,
        changes.notificationChannel.enabled,
      );
    }

    await this.repository.save(preferences);
    return preferences;
  }
}
