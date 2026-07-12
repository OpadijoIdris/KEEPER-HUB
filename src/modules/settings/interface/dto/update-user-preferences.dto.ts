import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { NotificationChannel } from '../../domain/value-objects/notification-preference.vo';

class NotificationChannelUpdateDto {
  @IsIn(['email', 'webhook', 'in_app'])
  channel!: NotificationChannel;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelUpdateDto)
  notificationChannel?: NotificationChannelUpdateDto;
}
