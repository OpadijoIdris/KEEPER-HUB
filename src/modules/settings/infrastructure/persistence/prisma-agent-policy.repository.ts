import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AgentPolicyRepository } from '../../domain/ports/agent-policy.repository';
import { AgentPolicy } from '../../domain/agent-policy.entity';
import type { AgentPolicyModel } from '../../../../generated/prisma/models';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class PrismaAgentPolicyRepository implements AgentPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAgentId(agentId: string): Promise<AgentPolicy | null> {
    const record = await this.prisma.agentPolicy.findUnique({ where: { agentId } });
    return record ? this.toDomain(record) : null;
  }

  async save(policy: AgentPolicy): Promise<void> {
    await this.prisma.agentPolicy.upsert({
      where: { agentId: policy.agentId },
      create: {
        id: policy.id,
        agentId: policy.agentId,
        spendLimit: policy.spendLimit,
        allowedActions: [...policy.allowedActions] as unknown as Prisma.InputJsonValue,
      },
      update: {
        spendLimit: policy.spendLimit,
        allowedActions: [...policy.allowedActions] as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private toDomain(record: AgentPolicyModel): AgentPolicy {
    return AgentPolicy.fromPersistence(
      record.id,
      record.agentId,
      record.spendLimit,
      record.allowedActions as string[],
    );
  }
}
