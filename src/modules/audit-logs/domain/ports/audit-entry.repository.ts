import { AuditEntry } from '../audit-entry.entity';
import type { PaginatedResult } from '../../../../shared/application/pagination';

export const AUDIT_ENTRY_REPOSITORY = Symbol('AUDIT_ENTRY_REPOSITORY');

export interface AuditQueryFilter {
  correlationId?: string;
  subjectId?: string;
  eventType?: string;
  from?: Date;
  to?: Date;
}

/**
 * append + query/findByCorrelationId only — no update, no delete. That
 * omission is the actual enforcement mechanism (see docs/ARCHITECTURE.md
 * §10.1); nothing about this interface's shape allows mutating a record
 * once written.
 */
export interface AuditEntryRepository {
  append(entry: AuditEntry): Promise<void>;
  findByCorrelationId(correlationId: string): Promise<AuditEntry[]>;
  query(
    filter: AuditQueryFilter,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<AuditEntry>>;
}
