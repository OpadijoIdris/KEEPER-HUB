import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import type { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { NotificationService } from '../../application/services/notification.service';
import { AgentService } from '../../../ai';

interface ExecutionCompletedPayload extends Record<string, unknown> {
  agentId: string;
  transactionHash?: string;
}

/**
 * Subscribes only to execution completion (see notification.entity.ts's
 * NotificationType comment — scoped narrow on purpose) rather than
 * subscribeToAll like Audit Logs. AgentService is injectable here without
 * this module importing AiModule (circular, since AiModule imports
 * KeeperHubIntegrationModule which this depends on indirectly) because
 * AiModule is @Global.
 */
@Injectable()
export class NotificationEventSubscriber implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventSubscriber.name);

  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly notificationService: NotificationService,
    private readonly agentService: AgentService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe('keeperhub.execution.completed', (event) => this.handle(event));
  }

  private async handle(event: DomainEvent<Record<string, unknown>>): Promise<void> {
    const payload = event.payload as ExecutionCompletedPayload;
    const agent = await this.agentService.getAgent(payload.agentId);
    if (!agent) {
      this.logger.warn(`Execution completed for unknown agent "${payload.agentId}" — skipping notification.`);
      return;
    }
    await this.notificationService.notifyExecutionCompleted(
      agent.ownerId,
      agent.name,
      payload.transactionHash,
    );
  }
}
