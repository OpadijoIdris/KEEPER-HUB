import { UserPreferences } from '../../domain/user-preferences.entity';
import { NotificationPreference } from '../../domain/value-objects/notification-preference.vo';

export interface UserPreferencesResponseDto {
  userId: string;
  timezone: string;
  notificationPreferences: NotificationPreference[];
}

/**
 * Domain entities never cross the HTTP boundary directly (see
 * docs/ARCHITECTURE.md §6.2) — a refactor of UserPreferences' internal shape
 * shouldn't silently change the API response.
 */
export function toUserPreferencesResponse(
  preferences: UserPreferences,
): UserPreferencesResponseDto {
  return {
    userId: preferences.userId,
    timezone: preferences.timezone.value,
    notificationPreferences: [...preferences.notificationPreferences],
  };
}
