import { Module } from '@nestjs/common';
import { AuditLogService } from './application/services/audit-log.service';
import { AuditLogController } from './interface/http/audit-log.controller';
import { AuditEventSubscriber } from './infrastructure/events/audit-event.subscriber';
import { PrismaAuditEntryRepository } from './infrastructure/persistence/prisma-audit-entry.repository';
import { AUDIT_ENTRY_REPOSITORY } from './domain/ports/audit-entry.repository';

/**
 * Bounded context: Audit Logs (docs/ARCHITECTURE.md §3, §4.2, §5.2). Pure
 * downstream listener — subscribes to every event via AuditEventSubscriber,
 * never calls into another module.
 */
@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditEventSubscriber,
    { provide: AUDIT_ENTRY_REPOSITORY, useClass: PrismaAuditEntryRepository },
  ],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
