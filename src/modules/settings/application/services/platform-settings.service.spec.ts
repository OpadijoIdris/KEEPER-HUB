import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettings } from '../../domain/platform-settings.entity';
import type { PlatformSettingsRepository } from '../../domain/ports/platform-settings.repository';

class FakePlatformSettingsRepository implements PlatformSettingsRepository {
  private stored: PlatformSettings | null = null;

  async get(): Promise<PlatformSettings | null> {
    return this.stored;
  }

  async save(settings: PlatformSettings): Promise<void> {
    this.stored = settings;
  }
}

describe('PlatformSettingsService', () => {
  it('isFeatureEnabled defaults false when nothing has ever been saved', async () => {
    const service = new PlatformSettingsService(new FakePlatformSettingsRepository());
    expect(await service.isFeatureEnabled('ai-orchestration')).toBe(false);
  });

  it('setFlag persists and is visible to a later isFeatureEnabled call', async () => {
    const repository = new FakePlatformSettingsRepository();
    const service = new PlatformSettingsService(repository);

    await service.setFlag('ai-orchestration', true);

    expect(await service.isFeatureEnabled('ai-orchestration')).toBe(true);
    expect(await repository.get()).not.toBeNull();
  });

  it('setFlag does not clobber other previously-set flags', async () => {
    const service = new PlatformSettingsService(new FakePlatformSettingsRepository());

    await service.setFlag('flag-a', true);
    await service.setFlag('flag-b', true);

    const flags = await service.getFeatureFlags();
    expect(flags).toEqual({ 'flag-a': true, 'flag-b': true });
  });
});
