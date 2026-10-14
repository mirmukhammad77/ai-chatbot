import { jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthResponceCodes } from '../../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../../shared/libs/hasher.lib.js';
import { JWT } from '../../../../shared/libs/jwt.lit.js';
import { type User } from '../../../users/entities/index.js';
import { UsersRepository } from '../../../users/repositories/users.repository.js';
import { AuthService } from '../auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let configGet: jest.Mock<(key: string) => string>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const configValues: Record<string, string> = {
      AUTH_JWT_ACCESS_SECRET: 'access-secret',
      AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
      AUTH_JWT_REFRESH_SECRET: 'refresh-secret',
      AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN: '12h',
    };
    const mockConfigService = {
      get: jest.fn((key: string) => configValues[key]),
    };
    configGet = mockConfigService.get;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user with email already exists', async () => {
      const existingUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'existing-hash',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      };

      usersRepository.findByEmail.mockResolvedValue(existingUser);
      const hasherSpy = jest.spyOn(Hasher, 'hash');

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toMatchObject({
        response: {
          code: AuthResponceCodes.UserExists,
          message: 'User already exists',
        },
      });

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(hasherSpy).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password, create user, and return mapped response without password', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const hasherSpy = jest.spyOn(Hasher, 'hash').mockResolvedValue('hashed_pw_secret');

      const createdUser: User = {
        id: 'uuid-1234',
        email: 'newuser@example.com',
        password: 'hashed_pw_secret',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'USER',
        createdAt: new Date('2026-02-01T12:00:00Z'),
        updatedAt: null,
        deletedAt: null,
      };

      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'newuser@example.com',
        password: 'plainPassword123',
      });

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(hasherSpy).toHaveBeenCalledWith('plainPassword123');
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'hashed_pw_secret',
      });

      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should rethrow error if repository create throws', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(Hasher, 'hash').mockResolvedValue('hashed_pw_secret');
      usersRepository.create.mockRejectedValue(new Error('Failed to create user'));

      await expect(
        service.register({
          email: 'newuser@example.com',
          password: 'plainPassword123',
        }),
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('login', () => {
    const args = { email: 'test@example.com', password: 'password123' };
    const user: User = {
      id: 'user-1',
      email: args.email,
      password: 'hashed-password',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'USER',
      createdAt: new Date('2026-02-01T12:00:00Z'),
      updatedAt: null,
      deletedAt: null,
    };

    it('throws NotFoundException when the email does not match a user', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const verifySpy = jest.spyOn(Hasher, 'verify');

      await expect(service.login(args)).rejects.toMatchObject({
        response: {
          code: AuthResponceCodes.UserNotFound,
          message: 'User not found',
        },
      });
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(args.email);
      expect(verifySpy).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when the password is incorrect', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);
      const verifySpy = jest.spyOn(Hasher, 'verify').mockResolvedValue(false);
      const signSpy = jest.spyOn(JWT, 'sign');

      await expect(service.login(args)).rejects.toMatchObject({
        response: {
          code: AuthResponceCodes.InvalidCredentials,
          message: 'Invalid credentials',
        },
      });
      expect(verifySpy).toHaveBeenCalledWith(user.password, args.password);
      expect(signSpy).not.toHaveBeenCalled();
    });

    it('verifies the password and returns access and refresh tokens', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);
      const verifySpy = jest.spyOn(Hasher, 'verify').mockResolvedValue(true);
      const signSpy = jest.spyOn(JWT, 'sign').mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      await expect(service.login(args)).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(verifySpy).toHaveBeenCalledWith(user.password, args.password);
      expect(signSpy).toHaveBeenNthCalledWith(1, { sub: user.id }, { secret: 'access-secret', expiresIn: '15m' });
      expect(signSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ sub: user.id, jti: expect.any(String) }), {
        secret: 'refresh-secret',
        expiresIn: '12h',
      });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_ACCESS_SECRET', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_REFRESH_SECRET', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN', { infer: true });
    });
  });
});
