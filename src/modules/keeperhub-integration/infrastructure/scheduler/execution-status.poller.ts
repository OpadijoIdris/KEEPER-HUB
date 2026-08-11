import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EXECUTION_REPOSITORY } from '../../domain/ports/execution.repository';
import type { ExecutionRepository } from '../../domain/ports/execution.repository';
import { ExecutionService } from '../../application/services/execution.service';

const POLL_INTERVAL_MS = 30_000;

/**
 * Closes the "execution status is pull-only" gap (README.md "Known gaps") —
 * reconciles every 'submitted' execution against KeeperHub on a timer
 * instead of only when a human clicks "Refresh". Read-only reconciliation
 * against an already-authorized execution, so unlike AgentEvaluationScheduler
 * this needs no safety gate: it never moves money, only observes status.
 */
@Injectable()
export class ExecutionStatusPoller {
  private readonly logger = new Logger(ExecutionStatusPoller.name);
  private polling = false;

  constructor(
    @Inject(EXECUTION_REPOSITORY) private readonly executions: ExecutionRepository,
    private readonly executionService: ExecutionService,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async pollSubmittedExecutions(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      const submitted = await this.executions.findByStatus('submitted');
      for (const execution of submitted) {
        try {
          await this.executionService.refreshStatus(execution.id);
        } catch (error) {
          this.logger.warn(
            `Failed to refresh execution "${execution.id}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      this.polling = false;
    }
  }
}
