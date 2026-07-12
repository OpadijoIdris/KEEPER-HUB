import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, AuthTokens } from '../../application/services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';

/**
 * Returns { accessToken, refreshToken } directly — this shape never touches
 * a domain entity (see docs/ARCHITECTURE.md §6.2), so a dedicated response
 * DTO/mapper would add ceremony without preventing anything a mapper exists
 * to prevent.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthTokens> {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }
}
