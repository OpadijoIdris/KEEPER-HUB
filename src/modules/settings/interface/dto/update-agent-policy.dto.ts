import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateAgentPolicyDto {
  @IsOptional()
  @IsString()
  spendLimit?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedActions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDestinations?: string[];
}
