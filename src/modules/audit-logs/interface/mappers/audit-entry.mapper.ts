import { AuditEntry } from '../../domain/audit-entry.entity';

export interface AuditEntryResponseDto {
  id: string;
  correlationId: string;
  occurredAt: string;
  eventType: string;
  subject: { type: string; id: string };
  actor: { type: string; id: string };
  severity: string;
  payload: Record<string, unknown>;
}

export function toAuditEntryResponse(entry: AuditEntry): AuditEntryResponseDto {
  return {
    id: entry.id,
    correlationId: entry.correlationId,
    occurredAt: entry.occurredAt.toISOString(),
    eventType: entry.eventType,
    subject: entry.subject,
    actor: entry.actor,
    severity: entry.severity,
    payload: entry.payload,
  };
}
