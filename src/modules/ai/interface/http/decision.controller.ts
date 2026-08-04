import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { DecisionService } from '../../application/services/decision.service';
import { EvaluateAgentDto } from '../dto/evaluate-agent.dto';
import { DecisionResponseDto, toDecisionResponse } from '../mappers/ai.mapper';

@Controller('agents/:agentId')
@UseGuards(JwtAuthGuard)
export class DecisionController {
  constructor(private readonly decisionService: DecisionService) {}

  @Post('evaluate')
  async evaluate(
    @Param('agentId') agentId: string,
    @Body() dto: EvaluateAgentDto,
  ): Promise<DecisionResponseDto> {
    const decision = await this.decisionService.evaluate(agentId, dto.triggerContext);
    return toDecisionResponse(decision);
  }

  @Get('decisions')
  async list(@Param('agentId') agentId: string): Promise<DecisionResponseDto[]> {
    const decisions = await this.decisionService.listByAgent(agentId);
    return decisions.map(toDecisionResponse);
  }
}
