import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
// Direct file import, not the `ai` barrel — see keeperhub-integration's
// execution-owner.guard.ts for why (CommonJS require() cycle at boot).
import { AgentOwnerGuard } from '../../../ai/interface/guards/agent-owner.guard';
import { AgentPolicyService } from '../../application/services/agent-policy.service';
import { UpdateAgentPolicyDto } from '../dto/update-agent-policy.dto';

interface AgentPolicyResponseDto {
  agentId: string;
  spendLimit: string;
  allowedActions: readonly string[];
}

@Controller('agents/:agentId/policy')
@UseGuards(JwtAuthGuard, AgentOwnerGuard())
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
