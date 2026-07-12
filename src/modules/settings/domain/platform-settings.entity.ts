import { Entity } from '../../../shared/domain/entity.base';

const SINGLETON_ID = 'singleton';

/** One row for the whole platform — ops-driven feature flags, admin-only. */
export class PlatformSettings extends Entity<string> {
  private constructor(private _featureFlags: Record<string, boolean>) {
    super(SINGLETON_ID);
  }

  get featureFlags(): Readonly<Record<string, boolean>> {
    return this._featureFlags;
  }

  static createDefault(): PlatformSettings {
    return new PlatformSettings({});
  }

  static fromPersistence(featureFlags: Record<string, boolean>): PlatformSettings {
    return new PlatformSettings(featureFlags);
  }

  isFeatureEnabled(flag: string): boolean {
    return this._featureFlags[flag] ?? false;
  }

  setFlag(flag: string, enabled: boolean): void {
    this._featureFlags = { ...this._featureFlags, [flag]: enabled };
  }
}
