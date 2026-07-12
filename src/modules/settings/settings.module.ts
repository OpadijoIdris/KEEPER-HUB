import { Module } from '@nestjs/common';
import { UserPreferencesService } from './application/services/user-preferences.service';
import { PlatformSettingsService } from './application/services/platform-settings.service';
import { UserPreferencesController } from './interface/http/user-preferences.controller';
import { FeatureFlagsController } from './interface/http/feature-flags.controller';
import { PrismaUserPreferencesRepository } from './infrastructure/persistence/prisma-user-preferences.repository';
import { PrismaPlatformSettingsRepository } from './infrastructure/persistence/prisma-platform-settings.repository';
import { USER_PREFERENCES_REPOSITORY } from './domain/ports/user-preferences.repository';
import { PLATFORM_SETTINGS_REPOSITORY } from './domain/ports/platform-settings.repository';

/**
 * Bounded context: Settings (docs/ARCHITECTURE.md §3, §4.1, §5.1).
 * AgentPolicy is deliberately not here yet — see ROADMAP.md Phase 2.1b, it's
 * deferred until the AI module's Agent aggregate exists to check ownership
 * against.
 */
@Module({
  controllers: [UserPreferencesController, FeatureFlagsController],
  providers: [
    UserPreferencesService,
    PlatformSettingsService,
    { provide: USER_PREFERENCES_REPOSITORY, useClass: PrismaUserPreferencesRepository },
    { provide: PLATFORM_SETTINGS_REPOSITORY, useClass: PrismaPlatformSettingsRepository },
  ],
  exports: [PlatformSettingsService],
})
export class SettingsModule {}
