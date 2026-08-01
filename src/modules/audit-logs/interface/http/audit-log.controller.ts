import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { AdminOnlyGuard } from '../../../../shared/interface/guards/admin-only.guard';
import type { PaginatedResult } from '../../../../shared/application/pagination';
import { AuditLogService } from '../../application/services/audit-log.service';
import { QueryAuditLogDto } from '../dto/query-audit-log.dto';
import { AuditEntryResponseDto, toAuditEntryResponse } from '../mappers/audit-entry.mapper';

/**
 * Admin-only (see docs/ARCHITECTURE.md §6.1) — the audit trail is an
 * operational/security surface, not a per-user feature.
 */
@Controller('audit-log')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async query(@Query() dto: QueryAuditLogDto): Promise<PaginatedResult<AuditEntryResponseDto>> {
    const result = await this.auditLogService.query(
      {
        correlationId: dto.correlationId,
        subjectId: dto.subjectId,
        eventType: dto.eventType,
        from: dto.from,
        to: dto.to,
      },
      dto.page ?? 1,
      dto.pageSize ?? 20,
    );

    return {
      items: result.items.map(toAuditEntryResponse),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
}
