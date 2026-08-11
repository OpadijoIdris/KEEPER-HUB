import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
// Direct file import, not the `ai` barrel — see keeperhub-integration's
// execution-owner.guard.ts for why (CommonJS require() cycle at boot).
// eslint-disable-next-line boundaries/element-types -- see comment above
import { AgentOwnerGuard } from '../../../ai/interface/guards/agent-owner.guard';
import { WalletService } from '../../application/services/wallet.service';
import { LinkWalletDto } from '../dto/link-wallet.dto';
import {
  AgentWalletResponseDto,
  PaymentAuthorizationResponseDto,
  toAgentWalletResponse,
  toPaymentAuthorizationResponse,
} from '../mappers/wallet.mapper';

@Controller('agents/:agentId/wallet')
@UseGuards(JwtAuthGuard, AgentOwnerGuard())
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Param('agentId') agentId: string): Promise<AgentWalletResponseDto> {
    const wallet = await this.walletService.getWallet(agentId);
    return toAgentWalletResponse(wallet);
  }

  /** Bring-your-own-wallet (README.md "Wallet model") — connect it on KeeperHub's dashboard first, then link it here. */
  @Patch()
  async linkWallet(
    @Param('agentId') agentId: string,
    @Body() dto: LinkWalletDto,
  ): Promise<AgentWalletResponseDto> {
    const wallet = await this.walletService.linkWallet(
      agentId,
      dto.address,
      dto.keeperHubIntegrationId,
    );
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
