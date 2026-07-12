export type NotificationChannel = 'email' | 'webhook' | 'in_app';

const ALL_CHANNELS: NotificationChannel[] = ['email', 'webhook', 'in_app'];

export interface NotificationPreference {
  readonly channel: NotificationChannel;
  readonly enabled: boolean;
}

/** email on, everything else off — a sensible default until the user says otherwise. */
export function defaultNotificationPreferences(): NotificationPreference[] {
  return ALL_CHANNELS.map((channel) => ({ channel, enabled: channel === 'email' }));
}
