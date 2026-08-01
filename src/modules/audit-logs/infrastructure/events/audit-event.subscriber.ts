import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import { AuditLogService } from '../../application/services/audit-log.service';

/**
 * Subscribes to every event on the bus (see docs/ARCHITECTURE.md §5.2) — a
 * new event type published anywhere else in the platform is audited
 * automatically, no change needed here.
 */
@Injectable()
export class AuditEventSubscriber implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly auditLogService: AuditLogService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribeToAll((event) => this.auditLogService.record(event));
  }
}
