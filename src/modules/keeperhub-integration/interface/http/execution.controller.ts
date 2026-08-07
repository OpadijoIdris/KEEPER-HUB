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
// Direct file import, not the `ai` barrel — see execution-owner.guard.ts's comment.
import { AgentOwnerGuard } from '../../../ai/interface/guards/agent-owner.guard';
import { ExecutionService } from '../../application/services/execution.service';
import { ExecutionOwnerGuard } from '../guards/execution-owner.guard';
import { ExecuteTransferDto } from '../dto/execute-transfer.dto';
import { ExecuteProtocolActionDto } from '../dto/execute-protocol-action.dto';
import { ExecutionResponseDto, toExecutionResponse } from '../mappers/execution.mapper';
import type { ProtocolAction } from '../../domain/ports/keeperhub-client.port';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('agents/:agentId/executions/transfer')
  @UseGuards(AgentOwnerGuard())
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
  @UseGuards(AgentOwnerGuard())
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
  @UseGuards(AgentOwnerGuard())
  async listByAgent(@Param('agentId') agentId: string): Promise<ExecutionResponseDto[]> {
    const executions = await this.executionService.listByAgent(agentId);
    return executions.map(toExecutionResponse);
  }

  @Get('executions/:executionId')
  @UseGuards(ExecutionOwnerGuard())
  async getExecution(@Param('executionId') executionId: string): Promise<ExecutionResponseDto> {
    const execution = await this.executionService.getExecution(executionId);
    if (!execution) throw new NotFoundException('Execution not found.');
    return toExecutionResponse(execution);
  }

  @Post('executions/:executionId/refresh')
  @UseGuards(ExecutionOwnerGuard())
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
