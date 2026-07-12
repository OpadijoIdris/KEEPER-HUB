import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PlatformSettingsRepository } from '../../domain/ports/platform-settings.repository';
import { PlatformSettings } from '../../domain/platform-settings.entity';

const SINGLETON_ID = 'singleton';

@Injectable()
export class PrismaPlatformSettingsRepository implements PlatformSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<PlatformSettings | null> {
    const record = await this.prisma.platformSettings.findUnique({
      where: { id: SINGLETON_ID },
    });
    return record
      ? PlatformSettings.fromPersistence(record.featureFlags as unknown as Record<string, boolean>)
      : null;
  }

  async save(settings: PlatformSettings): Promise<void> {
    await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, featureFlags: { ...settings.featureFlags } },
      update: { featureFlags: { ...settings.featureFlags } },
    });
  }
}
