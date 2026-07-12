import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { SelfOrAdminGuard } from '../../../../shared/interface/guards/self-or-admin.guard';
import { UserPreferencesService } from '../../application/services/user-preferences.service';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import {
  UserPreferencesResponseDto,
  toUserPreferencesResponse,
} from '../mappers/user-preferences.mapper';

@Controller('users/:userId/preferences')
@UseGuards(JwtAuthGuard, SelfOrAdminGuard('userId'))
export class UserPreferencesController {
  constructor(private readonly service: UserPreferencesService) {}

  @Get()
  async get(@Param('userId') userId: string): Promise<UserPreferencesResponseDto> {
    return toUserPreferencesResponse(await this.service.get(userId));
  }

  @Patch()
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const preferences = await this.service.update(userId, dto);
    return toUserPreferencesResponse(preferences);
  }
}
