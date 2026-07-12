import { UserPreferences } from './user-preferences.entity';
import { Timezone } from './value-objects/timezone.vo';

describe('UserPreferences', () => {
  it('defaults to UTC and email-only notifications', () => {
    const prefs = UserPreferences.createDefault('user-1');

    expect(prefs.timezone.value).toBe('UTC');
    expect(prefs.notificationPreferences).toEqual([
      { channel: 'email', enabled: true },
      { channel: 'webhook', enabled: false },
      { channel: 'in_app', enabled: false },
    ]);
  });

  it('updateTimezone changes only the timezone', () => {
    const prefs = UserPreferences.createDefault('user-1');
    prefs.updateTimezone(Timezone.create('Europe/London'));

    expect(prefs.timezone.value).toBe('Europe/London');
    expect(prefs.notificationPreferences.find((p) => p.channel === 'email')?.enabled).toBe(true);
  });

  it('setChannelEnabled flips only the targeted channel', () => {
    const prefs = UserPreferences.createDefault('user-1');
    prefs.setChannelEnabled('webhook', true);

    expect(prefs.notificationPreferences).toEqual([
      { channel: 'email', enabled: true },
      { channel: 'webhook', enabled: true },
      { channel: 'in_app', enabled: false },
    ]);
  });
});
