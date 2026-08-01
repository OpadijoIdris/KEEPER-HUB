import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AuditEntry } from '../../domain/audit-entry.entity';
import type {
  AuditEntryRepository,
  AuditQueryFilter,
} from '../../domain/ports/audit-entry.repository';
import type { PaginatedResult } from '../../../../shared/application/pagination';
import type { AuditEntryModel } from '../../../../generated/prisma/models';
import type { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class PrismaAuditEntryRepository implements AuditEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(entry: AuditEntry): Promise<void> {
    await this.prisma.auditEntry.create({
      data: {
        id: entry.id,
        correlationId: entry.correlationId,
        occurredAt: entry.occurredAt,
        eventType: entry.eventType,
        schemaVersion: entry.schemaVersion,
        subjectType: entry.subject.type,
        subjectId: entry.subject.id,
        actorType: entry.actor.type,
        actorId: entry.actor.id,
        severity: entry.severity,
        payload: entry.payload as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findByCorrelationId(correlationId: string): Promise<AuditEntry[]> {
    const records = await this.prisma.auditEntry.findMany({
      where: { correlationId },
      orderBy: { occurredAt: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async query(
    filter: AuditQueryFilter,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AuditEntry>> {
    const where: Prisma.AuditEntryWhereInput = {
      correlationId: filter.correlationId,
      subjectId: filter.subjectId,
      eventType: filter.eventType,
      occurredAt: {
        gte: filter.from,
        lte: filter.to,
      },
    };

    const [records, total] = await Promise.all([
      this.prisma.auditEntry.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditEntry.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toDomain(record)),
      page,
      pageSize,
      total,
    };
  }

  private toDomain(record: AuditEntryModel): AuditEntry {
    return AuditEntry.fromPersistence({
      id: record.id,
      correlationId: record.correlationId,
      occurredAt: record.occurredAt,
      eventType: record.eventType,
      schemaVersion: record.schemaVersion,
      subject: { type: record.subjectType, id: record.subjectId },
      actor: { type: record.actorType as 'system' | 'agent' | 'user', id: record.actorId },
      severity: record.severity as 'info' | 'warning' | 'critical',
      payload: record.payload as Record<string, unknown>,
    });
  }
}
