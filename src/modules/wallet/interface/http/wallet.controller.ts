import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { WalletService } from '../../application/services/wallet.service';
import {
  AgentWalletResponseDto,
  PaymentAuthorizationResponseDto,
  toAgentWalletResponse,
  toPaymentAuthorizationResponse,
} from '../mappers/wallet.mapper';

/**
 * Ownership scoping (only the agent's owner may view its wallet) is
 * deferred alongside AgentPolicy (ROADMAP.md 2.1b) — Agent.ownerId doesn't
 * exist until Day 3. JwtAuthGuard only for now, same tracked gap.
 */
@Controller('agents/:agentId/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Param('agentId') agentId: string): Promise<AgentWalletResponseDto> {
    const wallet = await this.walletService.getOrLinkWallet(agentId);
    return toAgentWalletResponse(wallet);
  }

  @Get('authorizations')
  async getAuthorizations(
    @Param('agentId') agentId: string,
  ): Promise<PaymentAuthorizationResponseDto[]> {
    const authorizations = await this.walletService.getAuthorizationHistory(agentId);
    return authorizations.map(toPaymentAuthorizationResponse);
  }
}
