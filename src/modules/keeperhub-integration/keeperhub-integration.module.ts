import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet';
import { ExecutionService } from './application/services/execution.service';
import { ExecutionController } from './interface/http/execution.controller';
import { KeeperHubMcpClientAdapter } from './infrastructure/external/keeperhub-mcp-client.adapter';
import { PrismaExecutionRepository } from './infrastructure/persistence/prisma-execution.repository';
import { ExecutionStatusPoller } from './infrastructure/scheduler/execution-status.poller';
import { EXECUTION_REPOSITORY } from './domain/ports/execution.repository';
import { KEEPERHUB_CLIENT } from './domain/ports/keeperhub-client.port';

/**
 * Bounded context: KeeperHub Integration (docs/ARCHITECTURE.md §3, §4.5,
 * §5.5) — revised per ROADMAP.md "KeeperHub live API reconnaissance":
 * direct execution primitives (execute_transfer/execute_protocol_action),
 * not workflow-graph construction. Imports WalletModule since
 * ExecutionService calls WalletService.authorizePayment before every
 * execution (Wallet is the supplier in this Customer/Supplier relationship).
 */
@Module({
  imports: [WalletModule],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ExecutionStatusPoller,
    { provide: EXECUTION_REPOSITORY, useClass: PrismaExecutionRepository },
    { provide: KEEPERHUB_CLIENT, useClass: KeeperHubMcpClientAdapter },
  ],
  exports: [ExecutionService],
})
export class KeeperHubIntegrationModule {}
