import { IsObject, IsString } from 'class-validator';

export class ExecuteProtocolActionDto {
  @IsString()
  actionType!: string;

  @IsObject()
  params!: Record<string, unknown>;
}
