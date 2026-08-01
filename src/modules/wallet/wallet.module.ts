import { Module } from '@nestjs/common';
import { WalletService } from './application/services/wallet.service';
import { WalletController } from './interface/http/wallet.controller';
import { PrismaAgentWalletRepository } from './infrastructure/persistence/prisma-agent-wallet.repository';
import { PrismaPaymentAuthorizationRepository } from './infrastructure/persistence/prisma-payment-authorization.repository';
import { AGENT_WALLET_REPOSITORY } from './domain/ports/agent-wallet.repository';
import { PAYMENT_AUTHORIZATION_REPOSITORY } from './domain/ports/payment-authorization.repository';

/**
 * Bounded context: Wallet (docs/ARCHITECTURE.md §3, §4.4, §5.4) — revised
 * scope per ROADMAP.md "KeeperHub live API reconnaissance": links agents to
 * an existing KeeperHub wallet integration and tracks payment-authorization
 * decisions, rather than provisioning wallets ourselves.
 */
@Module({
  controllers: [WalletController],
  providers: [
    WalletService,
    { provide: AGENT_WALLET_REPOSITORY, useClass: PrismaAgentWalletRepository },
    { provide: PAYMENT_AUTHORIZATION_REPOSITORY, useClass: PrismaPaymentAuthorizationRepository },
  ],
  exports: [WalletService],
})
export class WalletModule {}
