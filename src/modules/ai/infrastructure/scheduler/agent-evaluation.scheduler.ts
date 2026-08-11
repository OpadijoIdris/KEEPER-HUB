import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AGENT_REPOSITORY } from '../../domain/ports/agent.repository';
import type { AgentRepository } from '../../domain/ports/agent.repository';
import { DecisionService } from '../../application/services/decision.service';
import type { AppConfig } from '../../../../config/configuration';

const INTERVAL_NAME = 'agent-evaluation';

/**
 * Closes the "no live trigger system" gap (README.md "Known gaps") — turns
 * the manual "Evaluate now" click into a timer. Off by default
 * (AGENT_SCHEDULER_ENABLED) because, unlike ExecutionStatusPoller, this can
 * make agents spend real funds unattended: onModuleInit() registers no
 * interval at all unless explicitly enabled, so shipping this code changes
 * nothing until the flag is flipped.
 */
@Injectable()
export class AgentEvaluationScheduler implements OnModuleInit {
  private readonly logger = new Logger(AgentEvaluationScheduler.name);
  private running = false;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    private readonly decisionService: DecisionService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const { enabled, intervalMs } = this.config.get('agentScheduler', { infer: true });
    if (!enabled) {
      this.logger.log('AGENT_SCHEDULER_ENABLED is false — agent auto-evaluation loop not started.');
      return;
    }

    const interval = setInterval(() => void this.runCycle(), intervalMs);
    this.schedulerRegistry.addInterval(INTERVAL_NAME, interval);
    this.logger.log(`Agent auto-evaluation loop started (every ${intervalMs}ms).`);
  }

  async runCycle(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const activeAgents = await this.agents.findAllActive();
      for (const agent of activeAgents) {
        try {
          await this.decisionService.evaluate(agent.id, {
            source: 'scheduler',
            firedAt: new Date().toISOString(),
          });
        } catch (error) {
          this.logger.warn(
            `Scheduled evaluation failed for agent "${agent.id}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
