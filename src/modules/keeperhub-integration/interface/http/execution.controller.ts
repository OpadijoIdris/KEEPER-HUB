import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { ExecutionService } from '../../application/services/execution.service';
import { ExecuteTransferDto } from '../dto/execute-transfer.dto';
import { ExecuteProtocolActionDto } from '../dto/execute-protocol-action.dto';
import { ExecutionResponseDto, toExecutionResponse } from '../mappers/execution.mapper';
import type { ProtocolAction } from '../../domain/ports/keeperhub-client.port';

/** Ownership scoping deferred alongside AgentPolicy/Wallet (ROADMAP.md 2.1b) — same tracked gap. */
@Controller()
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('agents/:agentId/executions/transfer')
  async executeTransfer(
    @Param('agentId') agentId: string,
    @Body() dto: ExecuteTransferDto,
  ): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.executeTransfer(
      agentId,
      dto.chainId,
      dto.toAddress,
      dto.amount,
      dto.tokenAddress,
    );
    return toExecutionResponse(execution);
  }

  @Post('agents/:agentId/executions/protocol-action')
  async executeProtocolAction(
    @Param('agentId') agentId: string,
    @Body() dto: ExecuteProtocolActionDto,
  ): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.executeProtocolAction(
      agentId,
      dto.actionType,
      dto.params,
    );
    return toExecutionResponse(execution);
  }

  @Get('agents/:agentId/executions')
  async listByAgent(@Param('agentId') agentId: string): Promise<ExecutionResponseDto[]> {
    const executions = await this.executionService.listByAgent(agentId);
    return executions.map(toExecutionResponse);
  }

  @Get('executions/:executionId')
  async getExecution(@Param('executionId') executionId: string): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.getExecution(executionId);
    if (!execution) throw new NotFoundException('Execution not found.');
    return toExecutionResponse(execution);
  }

  @Post('executions/:executionId/refresh')
  async refreshStatus(@Param('executionId') executionId: string): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.refreshStatus(executionId);
    if (!execution) throw new NotFoundException('Execution not found.');
    return toExecutionResponse(execution);
  }

  @Get('protocol-actions')
  async searchProtocolActions(
    @Query('query') query?: string,
    @Query('protocol') protocol?: string,
  ): Promise<ProtocolAction[]> {
    return this.executionService.searchProtocolActions(query, protocol);
  }
}
