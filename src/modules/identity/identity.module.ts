import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../../config/configuration';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './interface/http/auth.controller';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { JwtAuthGuard } from './interface/guards/jwt-auth.guard';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher.adapter';
import { JwtTokenIssuerAdapter } from './infrastructure/security/jwt-token-issuer.adapter';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/ports/refresh-token.repository';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { TOKEN_ISSUER } from './domain/ports/token-issuer.port';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        secret: configService.get('jwt.accessSecret', { infer: true }),
        signOptions: { expiresIn: configService.get('jwt.accessTtl', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuerAdapter },
  ],
  exports: [JwtAuthGuard, AuthService],
})
export class IdentityModule {}
