import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity';
import { AdminOnlyGuard } from '../../../../shared/interface/guards/admin-only.guard';
import { PlatformSettingsService } from '../../application/services/platform-settings.service';
import { SetFeatureFlagDto } from '../dto/set-feature-flag.dto';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly service: PlatformSettingsService) {}

  @Get()
  getAll(): Promise<Readonly<Record<string, boolean>>> {
    return this.service.getFeatureFlags();
  }

  @Patch(':flag')
  @UseGuards(AdminOnlyGuard)
  async setFlag(
    @Param('flag') flag: string,
    @Body() dto: SetFeatureFlagDto,
  ): Promise<Readonly<Record<string, boolean>>> {
    await this.service.setFlag(flag, dto.enabled);
    return this.service.getFeatureFlags();
  }
}
