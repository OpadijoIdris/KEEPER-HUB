import { IsNotEmpty, Matches } from 'class-validator';

export class LinkWalletDto {
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'address must be a valid EVM address (0x... 40 hex chars).' })
  address!: string;

  @IsNotEmpty()
  keeperHubIntegrationId!: string;
}
