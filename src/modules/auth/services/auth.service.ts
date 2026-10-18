import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EnvConfig } from '../../../shared/configs/env.config.js';
import { AuthResponseCodes } from '../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../shared/libs/hasher.lib.js';
import { InvalidTokenError, JWT } from '../../../shared/libs/jwt.lit.js';
import { type CreateUserParams, UsersRepository } from '../../users/repositories/users.repository.js';
import { CreateUserResponseDto } from '../dtos/create-user.dto.js';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.payload.js';
import type { LoginResponse } from '../types/login-responce.js';

export type LoginArgs = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async register(params: CreateUserParams): Promise<CreateUserResponseDto> {
    const { email, password } = params;

    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      throw new ConflictException({
        code: AuthResponseCodes.UserExists,
        message: 'User already exists',
      });
    }

    const hashedPassword = await Hasher.hash(password);

    const newUser = await this.usersRepository.create({ email, password: hashedPassword });
    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  async login(args: LoginArgs): Promise<LoginResponse> {
    const { email, password } = args;
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: AuthResponseCodes.InvalidCredentials,
        message: 'Invalid credentials',
      });
    }

    const passwordMatch = await Hasher.verify(user.password, password);
    if (!passwordMatch) {
      throw new UnprocessableEntityException({
        code: AuthResponseCodes.InvalidCredentials,
        message: 'Invalid credentials',
      });
    }

    const accessToken = await this.createAccessToken(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken,
      refreshToken,
    };
  }

  async createAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
    };

    const options = {
      secret: this.configService.get('AUTH_JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.configService.get('AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN', { infer: true }),
    };

    return JWT.sign(payload, options);
  }

  public async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyRefreshToken(token);

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = await this.createAccessToken(user.id);
    const newRefreshToken = await this.createRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  public async createRefreshToken(userId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      jti: randomUUID(),
    };

    const options = {
      secret: this.configService.get('AUTH_JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.configService.get('AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN', { infer: true }),
    };

    return JWT.sign(payload, options);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const options = {
      secret: this.configService.get('AUTH_JWT_ACCESS_SECRET', { infer: true }),
      clockTolerance: 5,
    };

    try {
      return await JWT.verify<AccessTokenPayload>(token, options);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
      throw error;
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const options = {
      secret: this.configService.get('AUTH_JWT_REFRESH_SECRET', { infer: true }),
      clockTolerance: 5,
    };

    try {
      return await JWT.verify<RefreshTokenPayload>(token, options);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw error;
    }
  }
}
