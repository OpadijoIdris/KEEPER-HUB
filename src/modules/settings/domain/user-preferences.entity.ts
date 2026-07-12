import { randomUUID } from 'crypto';
import { Entity } from '../../../shared/domain/entity.base';
import { Timezone } from './value-objects/timezone.vo';
import {
  NotificationChannel,
  NotificationPreference,
  defaultNotificationPreferences,
} from './value-objects/notification-preference.vo';

/**
 * Not an AggregateRoot — no other module needs to react to a preferences
 * change via a domain event, it's pure self-service configuration read
 * directly by Notifications' Public API when it needs to check delivery
 * eligibility (docs/ARCHITECTURE.md §5.7).
 */
export class UserPreferences extends Entity<string> {
  private constructor(
    id: string,
    readonly userId: string,
    private _notificationPreferences: NotificationPreference[],
    private _timezone: Timezone,
  ) {
    super(id);
  }

  get notificationPreferences(): readonly NotificationPreference[] {
    return this._notificationPreferences;
  }

  get timezone(): Timezone {
    return this._timezone;
  }

  /** Not persisted until the user actually customizes something — see GetUserPreferencesQuery. */
  static createDefault(userId: string): UserPreferences {
    return new UserPreferences(
      randomUUID(),
      userId,
      defaultNotificationPreferences(),
      Timezone.default(),
    );
  }

  static fromPersistence(
    id: string,
    userId: string,
    notificationPreferences: NotificationPreference[],
    timezone: Timezone,
  ): UserPreferences {
    return new UserPreferences(id, userId, notificationPreferences, timezone);
  }

  updateTimezone(timezone: Timezone): void {
    this._timezone = timezone;
  }

  setChannelEnabled(channel: NotificationChannel, enabled: boolean): void {
    this._notificationPreferences = this._notificationPreferences.map((pref) =>
      pref.channel === channel ? { channel, enabled } : pref,
    );
  }
}
