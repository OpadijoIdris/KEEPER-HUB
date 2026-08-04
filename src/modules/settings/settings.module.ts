import { Module } from '@nestjs/common';
import { UserPreferencesService } from './application/services/user-preferences.service';
import { PlatformSettingsService } from './application/services/platform-settings.service';
import { AgentPolicyService } from './application/services/agent-policy.service';
import { UserPreferencesController } from './interface/http/user-preferences.controller';
import { FeatureFlagsController } from './interface/http/feature-flags.controller';
import { AgentPolicyController } from './interface/http/agent-policy.controller';
import { PrismaUserPreferencesRepository } from './infrastructure/persistence/prisma-user-preferences.repository';
import { PrismaPlatformSettingsRepository } from './infrastructure/persistence/prisma-platform-settings.repository';
import { PrismaAgentPolicyRepository } from './infrastructure/persistence/prisma-agent-policy.repository';
import { USER_PREFERENCES_REPOSITORY } from './domain/ports/user-preferences.repository';
import { PLATFORM_SETTINGS_REPOSITORY } from './domain/ports/platform-settings.repository';
import { AGENT_POLICY_REPOSITORY } from './domain/ports/agent-policy.repository';

/**
 * Bounded context: Settings (docs/ARCHITECTURE.md §3, §4.1, §5.1).
 * AgentPolicy (2.1b) is built alongside AI (Day 3) now that Agent exists.
 */
@Module({
  controllers: [UserPreferencesController, FeatureFlagsController, AgentPolicyController],
  providers: [
    UserPreferencesService,
    PlatformSettingsService,
    AgentPolicyService,
    { provide: USER_PREFERENCES_REPOSITORY, useClass: PrismaUserPreferencesRepository },
    { provide: PLATFORM_SETTINGS_REPOSITORY, useClass: PrismaPlatformSettingsRepository },
    { provide: AGENT_POLICY_REPOSITORY, useClass: PrismaAgentPolicyRepository },
  ],
  exports: [PlatformSettingsService, AgentPolicyService],
})
export class SettingsModule {}
