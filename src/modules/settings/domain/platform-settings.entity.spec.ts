import { PlatformSettings } from './platform-settings.entity';

describe('PlatformSettings', () => {
  it('an unknown flag defaults to disabled', () => {
    const settings = PlatformSettings.createDefault();
    expect(settings.isFeatureEnabled('anything')).toBe(false);
  });

  it('setFlag enables/disables a named flag without touching others', () => {
    const settings = PlatformSettings.createDefault();
    settings.setFlag('ai-orchestration', true);
    settings.setFlag('gas-sponsorship', false);

    expect(settings.isFeatureEnabled('ai-orchestration')).toBe(true);
    expect(settings.isFeatureEnabled('gas-sponsorship')).toBe(false);
    expect(settings.isFeatureEnabled('unrelated-flag')).toBe(false);
  });
});
