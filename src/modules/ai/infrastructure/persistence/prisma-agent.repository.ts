import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AgentRepository } from '../../domain/ports/agent.repository';
import { Agent, AgentStatus } from '../../domain/agent.entity';
import type { AgentModel } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaAgentRepository implements AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Agent | null> {
    const record = await this.prisma.agent.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Agent[]> {
    const records = await this.prisma.agent.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async save(agent: Agent): Promise<void> {
    await this.prisma.agent.upsert({
      where: { id: agent.id },
      create: {
        id: agent.id,
        ownerId: agent.ownerId,
        name: agent.name,
        monitoredTrigger: agent.monitoredTrigger,
        rules: agent.rules,
        status: agent.status,
        createdAt: agent.createdAt,
      },
      update: {
        name: agent.name,
        monitoredTrigger: agent.monitoredTrigger,
        rules: agent.rules,
        status: agent.status,
      },
    });
  }

  private toDomain(record: AgentModel): Agent {
    return Agent.fromPersistence(
      record.id,
      record.ownerId,
      record.name,
      record.monitoredTrigger,
      record.rules,
      record.status as AgentStatus,
      record.createdAt,
    );
  }
}
