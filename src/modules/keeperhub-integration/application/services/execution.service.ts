import { Inject, Injectable } from '@nestjs/common';
import { Execution } from '../../domain/execution.entity';
import { EXECUTION_REPOSITORY } from '../../domain/ports/execution.repository';
import type { ExecutionRepository } from '../../domain/ports/execution.repository';
import { KEEPERHUB_CLIENT } from '../../domain/ports/keeperhub-client.port';
import type { KeeperHubClient, ProtocolAction } from '../../domain/ports/keeperhub-client.port';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import { WalletService } from '../../../wallet';

@Injectable()
export class ExecutionService {
  constructor(
    @Inject(EXECUTION_REPOSITORY) private readonly executions: ExecutionRepository,
    @Inject(KEEPERHUB_CLIENT) private readonly keeperHub: KeeperHubClient,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    private readonly walletService: WalletService,
  ) {}

  async executeTransfer(
    agentId: string,
    chainId: string,
    toAddress: string,
    amount: string,
    tokenAddress?: string,
  ): Promise<Execution> {
    // Wallet is the supplier here (docs/ARCHITECTURE.md context map) — an
    // execution that can't be paid for never reaches KeeperHub at all.
    const authorization = await this.walletService.authorizePayment(
      agentId,
      'transfer',
      amount,
      tokenAddress ?? 'native',
    );

    const execution = Execution.create(agentId, 'transfer', {
      chainId,
      toAddress,
      amount,
      tokenAddress,
    });

    if (authorization.status === 'rejected') {
      execution.markFailed(authorization.reason ?? 'Payment authorization rejected.');
      await this.executions.save(execution);
      await this.publishEvents(execution);
      return execution;
    }

    await this.executions.save(execution);

    try {
      // KeeperHub's documented safety flow (ROADMAP.md "KeeperHub live API
      // reconnaissance"): preflight with simulate=true, only broadcast for
      // real once it comes back clean.
      const simulation = await this.keeperHub.simulateTransfer({
        chainId,
        toAddress,
        amount,
        tokenAddress,
        idempotencyKey: execution.id,
      });
      if (!simulation.success || simulation.wouldRevert) {
        execution.markFailed(simulation.error ?? 'Transfer simulation indicated it would revert.');
      } else {
        const handle = await this.keeperHub.executeTransfer({
          chainId,
          toAddress,
          amount,
          tokenAddress,
          idempotencyKey: execution.id,
        });
        execution.markSubmitted(handle.keeperHubExecutionId);
      }
    } catch (error) {
      execution.markFailed(error instanceof Error ? error.message : String(error));
    }

    await this.executions.save(execution);
    await this.publishEvents(execution);
    return execution;
  }

  async executeProtocolAction(
    agentId: string,
    actionType: string,
    params: Record<string, unknown>,
  ): Promise<Execution> {
    const authorization = await this.walletService.authorizePayment(
      agentId,
      'protocol_action',
      '0',
      'n/a',
    );

    const execution = Execution.create(agentId, 'protocol_action', { actionType, params });

    if (authorization.status === 'rejected') {
      execution.markFailed(authorization.reason ?? 'Payment authorization rejected.');
      await this.executions.save(execution);
      await this.publishEvents(execution);
      return execution;
    }

    await this.executions.save(execution);

    try {
      const handle = await this.keeperHub.executeProtocolAction({
        actionType,
        params,
        idempotencyKey: execution.id,
      });
      execution.markSubmitted(handle.keeperHubExecutionId);
    } catch (error) {
      execution.markFailed(error instanceof Error ? error.message : String(error));
    }

    await this.executions.save(execution);
    await this.publishEvents(execution);
    return execution;
  }

  /** On-demand status check — see the module's design note on why this isn't a background poller. */
  async refreshStatus(executionId: string): Promise<Execution | null> {
    const execution = await this.executions.findById(executionId);
    if (!execution) return null;
    if (execution.status === 'confirmed' || execution.status === 'failed') return execution;
    if (!execution.keeperHubExecutionId) return execution;

    const status = await this.keeperHub.getExecutionStatus(execution.keeperHubExecutionId);
    if (status.status === 'confirmed') {
      execution.markConfirmed(status.transactionHash, status.result);
    } else if (status.status === 'failed') {
      execution.markReverted(status.error ?? 'Execution failed on KeeperHub.');
    }

    await this.executions.save(execution);
    await this.publishEvents(execution);
    return execution;
  }

  async getExecution(executionId: string): Promise<Execution | null> {
    return this.executions.findById(executionId);
  }

  async listByAgent(agentId: string): Promise<Execution[]> {
    return this.executions.findByAgentId(agentId);
  }

  async searchProtocolActions(query?: string, protocol?: string): Promise<ProtocolAction[]> {
    return this.keeperHub.searchProtocolActions(query, protocol);
  }

  private async publishEvents(execution: Execution): Promise<void> {
    for (const event of execution.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
