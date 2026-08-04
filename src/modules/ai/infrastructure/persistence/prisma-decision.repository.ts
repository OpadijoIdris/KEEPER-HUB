import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { DecisionRepository } from '../../domain/ports/decision.repository';
import { Decision, DecisionOutcome } from '../../domain/decision.entity';
import type { DecisionModel } from '../../../../generated/prisma/models';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class PrismaDecisionRepository implements DecisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Decision | null> {
    const record = await this.prisma.decision.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByAgentId(agentId: string): Promise<Decision[]> {
    const records = await this.prisma.decision.findMany({
      where: { agentId },
      orderBy: { evaluatedAt: 'desc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async save(decision: Decision): Promise<void> {
    await this.prisma.decision.create({
      data: {
        id: decision.id,
        agentId: decision.agentId,
        triggerContext: decision.triggerContext as Prisma.InputJsonValue,
        outcome: decision.outcome,
        rationale: decision.rationale,
        resultingExecutionId: decision.resultingExecutionId,
        evaluatedAt: decision.evaluatedAt,
      },
    });
  }

  private toDomain(record: DecisionModel): Decision {
    return Decision.fromPersistence(
      record.id,
      record.agentId,
      record.triggerContext as Record<string, unknown>,
      record.outcome as DecisionOutcome,
      record.rationale,
      record.resultingExecutionId,
      record.evaluatedAt,
    );
  }
}
