import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { AgentPolicyService } from '../../application/services/agent-policy.service';
import { UpdateAgentPolicyDto } from '../dto/update-agent-policy.dto';

interface AgentPolicyResponseDto {
  agentId: string;
  spendLimit: string;
  allowedActions: readonly string[];
}

/**
 * Ownership scoping deferred — same tracked gap as Wallet/Executions
 * (ROADMAP.md 2.1b originally, now built alongside AI in the same Day 3
 * pass, but kept consistent with the existing pattern rather than adding a
 * one-off exception here).
 */
@Controller('agents/:agentId/policy')
@UseGuards(JwtAuthGuard)
export class AgentPolicyController {
  constructor(private readonly agentPolicyService: AgentPolicyService) {}

  @Get()
  async get(@Param('agentId') agentId: string): Promise<AgentPolicyResponseDto> {
    const policy = await this.agentPolicyService.get(agentId);
    return { agentId: policy.agentId, spendLimit: policy.spendLimit, allowedActions: policy.allowedActions };
  }

  @Patch()
  async update(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentPolicyDto,
  ): Promise<AgentPolicyResponseDto> {
    const policy = await this.agentPolicyService.update(agentId, dto.spendLimit, dto.allowedActions);
    return { agentId: policy.agentId, spendLimit: policy.spendLimit, allowedActions: policy.allowedActions };
  }
}
