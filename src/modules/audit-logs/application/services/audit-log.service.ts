import { Inject, Injectable } from '@nestjs/common';
import type { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { AuditEntry } from '../../domain/audit-entry.entity';
import { AUDIT_ENTRY_REPOSITORY } from '../../domain/ports/audit-entry.repository';
import type {
  AuditEntryRepository,
  AuditQueryFilter,
} from '../../domain/ports/audit-entry.repository';
import type { PaginatedResult } from '../../../../shared/application/pagination';

@Injectable()
export class AuditLogService {
  constructor(@Inject(AUDIT_ENTRY_REPOSITORY) private readonly repository: AuditEntryRepository) {}

  /**
   * Never exposed over HTTP — invoked only by AuditEventSubscriber (see
   * docs/ARCHITECTURE.md §5.2). This is the one and only write path.
   */
  async record(event: DomainEvent<Record<string, unknown>>): Promise<void> {
    const entry = AuditEntry.record({
      correlationId: event.correlationId,
      occurredAt: event.occurredAt,
      eventType: event.eventType,
      schemaVersion: event.schemaVersion,
      subject: event.subject,
      actor: event.actor,
      severity: event.severity,
      payload: event.payload,
    });
    await this.repository.append(entry);
  }

  async query(
    filter: AuditQueryFilter,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AuditEntry>> {
    return this.repository.query(filter, page, pageSize);
  }

  async findByCorrelationId(correlationId: string): Promise<AuditEntry[]> {
    return this.repository.findByCorrelationId(correlationId);
  }
}
