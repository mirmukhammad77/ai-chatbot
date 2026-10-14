import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EnvConfig } from '../../../shared/configs/env.config.js';
import { AuthResponceCodes } from '../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../shared/libs/hasher.lib.js';
import { JWT } from '../../../shared/libs/jwt.lit.js';
import { type CreateUserParams, UsersRepository } from '../../users/repositories/users.repository.js';
import { CreateUserResponseDto } from '../dtos/create-user.dto.js';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.payload.js';

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
        code: AuthResponceCodes.UserExists,
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

  async login(args: LoginArgs): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = args;
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException({
        code: AuthResponceCodes.UserNotFound,
        message: 'User not found',
      });
    }

    const passwordMatch = await Hasher.verify(user.password, password);
    if (!passwordMatch) {
      throw new UnprocessableEntityException({
        code: AuthResponceCodes.InvalidCredentials,
        message: 'Invalid credentials',
      });
    }

    const accessToken = await this.createAccessToken(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken };
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
}
