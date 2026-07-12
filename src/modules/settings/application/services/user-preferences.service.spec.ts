import { UserPreferencesService } from './user-preferences.service';
import { UserPreferences } from '../../domain/user-preferences.entity';
import type { UserPreferencesRepository } from '../../domain/ports/user-preferences.repository';

class FakeUserPreferencesRepository implements UserPreferencesRepository {
  private readonly byUserId = new Map<string, UserPreferences>();

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    return this.byUserId.get(userId) ?? null;
  }

  async save(preferences: UserPreferences): Promise<void> {
    this.byUserId.set(preferences.userId, preferences);
  }
}

describe('UserPreferencesService', () => {
  it('get returns defaults without persisting anything', async () => {
    const repository = new FakeUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    const prefs = await service.get('user-1');

    expect(prefs.timezone.value).toBe('UTC');
    expect(await repository.findByUserId('user-1')).toBeNull();
  });

  it('update persists both a timezone and a channel change together', async () => {
    const repository = new FakeUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    const updated = await service.update('user-1', {
      timezone: 'Europe/London',
      notificationChannel: { channel: 'webhook', enabled: true },
    });

    expect(updated.timezone.value).toBe('Europe/London');
    expect(updated.notificationPreferences.find((p) => p.channel === 'webhook')?.enabled).toBe(
      true,
    );

    const persisted = await repository.findByUserId('user-1');
    expect(persisted?.timezone.value).toBe('Europe/London');
  });

  it('a second update builds on the first, not on stale defaults', async () => {
    const repository = new FakeUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    await service.update('user-1', { timezone: 'Europe/London' });
    const second = await service.update('user-1', {
      notificationChannel: { channel: 'webhook', enabled: true },
    });

    expect(second.timezone.value).toBe('Europe/London');
    expect(second.notificationPreferences.find((p) => p.channel === 'webhook')?.enabled).toBe(true);
  });
});
