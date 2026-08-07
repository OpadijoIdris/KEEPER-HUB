import { Global, Module } from '@nestjs/common';
import { SettingsModule } from '../settings';
import { KeeperHubIntegrationModule } from '../keeperhub-integration';
import { AgentService } from './application/services/agent.service';
import { DecisionService } from './application/services/decision.service';
import { AgentController } from './interface/http/agent.controller';
import { DecisionController } from './interface/http/decision.controller';
import { PrismaAgentRepository } from './infrastructure/persistence/prisma-agent.repository';
import { PrismaDecisionRepository } from './infrastructure/persistence/prisma-decision.repository';
import { OxloAgentReasoningAdapter } from './infrastructure/external/oxlo-agent-reasoning.adapter';
import { AGENT_REPOSITORY } from './domain/ports/agent.repository';
import { DECISION_REPOSITORY } from './domain/ports/decision.repository';
import { AGENT_REASONING } from './domain/ports/agent-reasoning.port';

/**
 * Bounded context: AI (docs/ARCHITECTURE.md §3, §4.6, §5.6). Imports
 * SettingsModule (AgentPolicy gates what the LLM is allowed to decide) and
 * KeeperHubIntegrationModule (an "execute" decision becomes a real
 * Execution) — the module where "AI decides, KeeperHub executes" actually
 * happens.
 *
 * @Global so AgentService (and the ownership guards built on it, see
 * AgentOwnerGuard) is injectable from Wallet/Settings/KeeperHub Integration
 * without those modules formally importing AiModule — which would be
 * circular, since AiModule already imports KeeperHubIntegrationModule
 * (-> WalletModule -> SettingsModule). Every other module still only
 * *depends on* AI's Public API by reference (AgentService, AgentOwnerGuard),
 * never the reverse.
 */
@Global()
@Module({
  imports: [SettingsModule, KeeperHubIntegrationModule],
  controllers: [AgentController, DecisionController],
  providers: [
    AgentService,
    DecisionService,
    { provide: AGENT_REPOSITORY, useClass: PrismaAgentRepository },
    { provide: DECISION_REPOSITORY, useClass: PrismaDecisionRepository },
    { provide: AGENT_REASONING, useClass: OxloAgentReasoningAdapter },
  ],
  exports: [AgentService, DecisionService],
})
export class AiModule {}
