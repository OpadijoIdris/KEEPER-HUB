import { IsObject } from 'class-validator';

export class EvaluateAgentDto {
  @IsObject()
  triggerContext!: Record<string, unknown>;
}
