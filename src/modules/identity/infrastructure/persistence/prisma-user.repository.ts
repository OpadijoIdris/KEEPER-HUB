import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { UserRepository } from '../../domain/ports/user.repository';
import { User, UserRole } from '../../domain/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import type { UserModel as PrismaUser } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email: email.value } });
    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash.value,
        role: user.role,
        createdAt: user.createdAt,
      },
      update: {
        passwordHash: user.passwordHash.value,
      },
    });
  }

  private toDomain(record: PrismaUser): User {
    return User.fromPersistence(
      record.id,
      Email.create(record.email),
      PasswordHash.fromHash(record.passwordHash),
      record.role as UserRole,
      record.createdAt,
    );
  }
}
