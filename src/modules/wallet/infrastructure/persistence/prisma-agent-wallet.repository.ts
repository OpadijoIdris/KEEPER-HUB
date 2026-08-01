import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AgentWalletRepository } from '../../domain/ports/agent-wallet.repository';
import { AgentWallet } from '../../domain/agent-wallet.entity';
import type { AgentWalletModel } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaAgentWalletRepository implements AgentWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAgentId(agentId: string): Promise<AgentWallet | null> {
    const record = await this.prisma.agentWallet.findUnique({ where: { agentId } });
    return record ? this.toDomain(record) : null;
  }

  async save(wallet: AgentWallet): Promise<void> {
    await this.prisma.agentWallet.upsert({
      where: { agentId: wallet.agentId },
      create: {
        id: wallet.id,
        agentId: wallet.agentId,
        address: wallet.address,
        keeperHubIntegrationId: wallet.keeperHubIntegrationId,
        linkedAt: wallet.linkedAt,
      },
      update: {},
    });
  }

  private toDomain(record: AgentWalletModel): AgentWallet {
    return AgentWallet.fromPersistence(
      record.id,
      record.agentId,
      record.address,
      record.keeperHubIntegrationId,
      record.linkedAt,
    );
  }
}
