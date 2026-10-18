import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { EnvConfig } from '../../../shared/configs/env.config.js';
import { Public } from '../../../shared/decorators/public.decorator.js';
import { Cookie } from '../decorators/cookie.decorator.js';
import { CreateUserDto, CreateUserResponseDto } from '../dtos/create-user.dto.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
export class AuthController {
  private readonly refreshMaxAge: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {
    const raw = this.configService.get('AUTH_REFRESH_COOKIE_MAX_AGE_MS', { infer: true });
    this.refreshMaxAge = typeof raw === 'number' ? raw : Number(raw);
  }

  @Public()
  @Post('register')
  async register(@Body() params: CreateUserDto): Promise<CreateUserResponseDto> {
    return await this.authService.register(params);
  }

  @Public()
  @Post('login')
  async login(@Body() params: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, id, email, firstName, lastName, role } = await this.authService.login(params);

    const csrfToken = this.generateCsrfToken();

    this.setAuthCookies(res, refreshToken, csrfToken);

    return {
      accessToken,
      id,
      email,
      firstName,
      lastName,
      role,
    };
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Cookie('refresh_token') refreshToken: string | null,
    @Cookie('csrf_token') csrfToken: string | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('missing refresh token');
    }

    if (!csrfToken) {
      throw new UnauthorizedException('missing csrf token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);

    const newCsrfToken = this.generateCsrfToken();

    this.setAuthCookies(res, newRefreshToken, newCsrfToken);

    return { accessToken };
  }

  setAuthCookies(res: Response, refreshToken: string, csrfToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: this.refreshMaxAge,
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: this.refreshMaxAge,
    });
  }

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }
}
