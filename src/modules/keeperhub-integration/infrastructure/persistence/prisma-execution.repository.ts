import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ExecutionRepository } from '../../domain/ports/execution.repository';
import { Execution, ExecutionKind, ExecutionStatus } from '../../domain/execution.entity';
import type { ExecutionModel } from '../../../../generated/prisma/models';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class PrismaExecutionRepository implements ExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Execution | null> {
    const record = await this.prisma.execution.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByAgentId(agentId: string): Promise<Execution[]> {
    const records = await this.prisma.execution.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findByStatus(status: ExecutionStatus): Promise<Execution[]> {
    const records = await this.prisma.execution.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async save(execution: Execution): Promise<void> {
    await this.prisma.execution.upsert({
      where: { id: execution.id },
      create: {
        id: execution.id,
        agentId: execution.agentId,
        kind: execution.kind,
        params: execution.params as unknown as Prisma.InputJsonValue,
        status: execution.status,
        keeperHubExecutionId: execution.keeperHubExecutionId,
        transactionHash: execution.transactionHash,
        failureReason: execution.failureReason,
        createdAt: execution.createdAt,
      },
      update: {
        status: execution.status,
        keeperHubExecutionId: execution.keeperHubExecutionId,
        transactionHash: execution.transactionHash,
        failureReason: execution.failureReason,
      },
    });
  }

  private toDomain(record: ExecutionModel): Execution {
    return Execution.fromPersistence(
      record.id,
      record.agentId,
      record.kind as ExecutionKind,
      record.params as Record<string, unknown>,
      record.status as ExecutionStatus,
      record.keeperHubExecutionId,
      record.transactionHash,
      record.failureReason,
      record.createdAt,
    );
  }
}
