import { IsBoolean } from 'class-validator';

export class SetFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;
}
