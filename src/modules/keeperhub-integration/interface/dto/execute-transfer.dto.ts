import { IsOptional, IsString } from 'class-validator';

export class ExecuteTransferDto {
  @IsString()
  chainId!: string;

  @IsString()
  toAddress!: string;

  @IsString()
  amount!: string;

  @IsOptional()
  @IsString()
  tokenAddress?: string;
}
