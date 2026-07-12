import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import { RefreshToken } from '../../domain/refresh-token.entity';
import type { RefreshTokenModel as PrismaRefreshToken } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return record ? this.toDomain(record) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.upsert({
      where: { id: token.id },
      create: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
      },
      update: {
        revokedAt: token.revokedAt,
      },
    });
  }

  private toDomain(record: PrismaRefreshToken): RefreshToken {
    return RefreshToken.fromPersistence(
      record.id,
      record.userId,
      record.tokenHash,
      record.expiresAt,
      record.revokedAt,
    );
  }
}
