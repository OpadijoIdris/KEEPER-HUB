import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../../../identity';
import type { AccessTokenClaims } from '../../../identity';
import { AgentService } from '../../application/services/agent.service';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { AgentResponseDto, toAgentResponse } from '../mappers/ai.mapper';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenClaims,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentService.create(user.sub, dto.name, dto.monitoredTrigger, dto.rules);
    return toAgentResponse(agent);
  }

  @Get()
  async list(@CurrentUser() user: AccessTokenClaims): Promise<AgentResponseDto[]> {
    const agents = await this.agentService.listByOwner(user.sub);
    return agents.map(toAgentResponse);
  }

  @Get(':agentId')
  async get(@Param('agentId') agentId: string): Promise<AgentResponseDto | null> {
    const agent = await this.agentService.getAgent(agentId);
    return agent ? toAgentResponse(agent) : null;
  }

  @Post(':agentId/activate')
  async activate(@Param('agentId') agentId: string): Promise<AgentResponseDto> {
    const agent = await this.agentService.activate(agentId);
    return toAgentResponse(agent);
  }

  @Post(':agentId/pause')
  async pause(@Param('agentId') agentId: string): Promise<AgentResponseDto> {
    const agent = await this.agentService.pause(agentId);
    return toAgentResponse(agent);
  }

  @Post(':agentId/retire')
  async retire(@Param('agentId') agentId: string): Promise<AgentResponseDto> {
    const agent = await this.agentService.retire(agentId);
    return toAgentResponse(agent);
  }
}
