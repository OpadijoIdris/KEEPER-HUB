import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

/**
 * The single Prisma client for the whole app (see docs/ARCHITECTURE.md §2).
 * No module creates its own PrismaClient — every repository adapter injects
 * this service and queries only the tables its own module owns.
 *
 * Prisma 7 client construction takes a driver adapter rather than reading
 * the connection string from the schema file; `prisma.config.ts` supplies
 * the same DATABASE_URL to the CLI (migrate/db push) separately.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
