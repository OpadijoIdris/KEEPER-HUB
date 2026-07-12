import { Inject, Injectable } from '@nestjs/common';
import { PlatformSettings } from '../../domain/platform-settings.entity';
import { PLATFORM_SETTINGS_REPOSITORY } from '../../domain/ports/platform-settings.repository';
import type { PlatformSettingsRepository } from '../../domain/ports/platform-settings.repository';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY)
    private readonly repository: PlatformSettingsRepository,
  ) {}

  private async getOrDefault(): Promise<PlatformSettings> {
    return (await this.repository.get()) ?? PlatformSettings.createDefault();
  }

  async getFeatureFlags(): Promise<Readonly<Record<string, boolean>>> {
    return (await this.getOrDefault()).featureFlags;
  }

  /** Used by other modules' Public APIs to gate in-progress functionality — see §5.1. */
  async isFeatureEnabled(flag: string): Promise<boolean> {
    return (await this.getOrDefault()).isFeatureEnabled(flag);
  }

  async setFlag(flag: string, enabled: boolean): Promise<void> {
    const settings = await this.getOrDefault();
    settings.setFlag(flag, enabled);
    await this.repository.save(settings);
  }
}
