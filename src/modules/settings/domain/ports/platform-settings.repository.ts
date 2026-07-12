import { PlatformSettings } from '../platform-settings.entity';

export const PLATFORM_SETTINGS_REPOSITORY = Symbol('PLATFORM_SETTINGS_REPOSITORY');

export interface PlatformSettingsRepository {
  get(): Promise<PlatformSettings | null>;
  save(settings: PlatformSettings): Promise<void>;
}
