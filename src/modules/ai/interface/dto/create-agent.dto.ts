import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  monitoredTrigger!: string;

  @IsString()
  @IsNotEmpty()
  rules!: string;
}
