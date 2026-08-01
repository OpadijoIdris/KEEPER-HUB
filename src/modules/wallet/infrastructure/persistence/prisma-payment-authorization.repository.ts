import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PaymentAuthorizationRepository } from '../../domain/ports/payment-authorization.repository';
import {
  PaymentAuthorization,
  PaymentAuthorizationStatus,
} from '../../domain/payment-authorization.entity';
import type { PaymentAuthorizationModel } from '../../../../generated/prisma/models';

@Injectable()
export class PrismaPaymentAuthorizationRepository implements PaymentAuthorizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(authorization: PaymentAuthorization): Promise<void> {
    await this.prisma.paymentAuthorization.create({
      data: {
        id: authorization.id,
        agentWalletId: authorization.agentWalletId,
        agentId: authorization.agentId,
        amount: authorization.amount,
        asset: authorization.asset,
        status: authorization.status,
        reason: authorization.reason,
        decidedAt: authorization.decidedAt,
      },
    });
  }

  async findByAgentId(agentId: string): Promise<PaymentAuthorization[]> {
    const records = await this.prisma.paymentAuthorization.findMany({
      where: { agentId },
      orderBy: { decidedAt: 'desc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: PaymentAuthorizationModel): PaymentAuthorization {
    return PaymentAuthorization.fromPersistence(
      record.id,
      record.agentWalletId,
      record.agentId,
      record.amount,
      record.asset,
      record.status as PaymentAuthorizationStatus,
      record.reason,
      record.decidedAt,
    );
  }
}
