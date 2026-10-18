import { jest } from '@jest/globals';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthResponseCodes } from '../../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../../shared/libs/hasher.lib.js';
import { InvalidTokenError, JWT } from '../../../../shared/libs/jwt.lib.js';
import { RefreshTokenHasher } from '../../../../shared/libs/refresh-token.hasher.lib.js';
import { type Tx, UnitOfWork } from '../../../database/unit-of-work.js';
import { SessionsRepository } from '../../../sessions/repositories/sessions.repository.js';
import { type User } from '../../../users/entities/index.js';
import { UsersRepository } from '../../../users/repositories/users.repository.js';
import { AuthService } from '../auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let sessionsRepository: jest.Mocked<SessionsRepository>;
  let configGet: jest.Mock<(key: string) => string | number | undefined>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    const mockSessionsRepository = {
      createSession: jest.fn(() => Promise.resolve({ refreshTokenHash: 'refresh-token' })),
      rotateRefreshToken: jest.fn(() => Promise.resolve({ refreshTokenHash: 'new-refresh-token' })),
      revokeSession: jest.fn(() => Promise.resolve(true)),
    };
    const mockUnitOfWork: Pick<UnitOfWork, 'run'> = {
      run: async <T>(callback: (tx: Tx) => Promise<T>) => callback({} as Tx),
    };
    const configValues: Record<string, string | number> = {
      AUTH_JWT_ACCESS_SECRET: 'access-secret',
      AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
      AUTH_JWT_REFRESH_SECRET: 'refresh-secret',
      AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN: 43200000,
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
        {
          provide: SessionsRepository,
          useValue: mockSessionsRepository,
        },
        {
          provide: UnitOfWork,
          useValue: mockUnitOfWork,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    sessionsRepository = module.get(SessionsRepository);
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
          code: AuthResponseCodes.UserExists,
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
          code: AuthResponseCodes.InvalidCredentials,
          message: 'Invalid credentials',
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
          code: AuthResponseCodes.InvalidCredentials,
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
      const refreshTokenHash = await RefreshTokenHasher.hash('refresh-token');

      await expect(service.login(args)).resolves.toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(verifySpy).toHaveBeenCalledWith(user.password, args.password);
      expect(signSpy).toHaveBeenNthCalledWith(1, { sub: user.id }, { secret: 'access-secret', expiresIn: '15m' });
      expect(signSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ sub: user.id, jti: expect.any(String) }), {
        secret: 'refresh-secret',
        expiresIn: '43200 seconds',
      });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_ACCESS_SECRET', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_REFRESH_SECRET', { infer: true });
      expect(configGet).toHaveBeenCalledWith('AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN', { infer: true });
      expect(sessionsRepository.createSession).toHaveBeenCalledWith(user.id, refreshTokenHash, expect.any(Date));
    });

    it('throws when it cannot persist the refresh-token session', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(Hasher, 'verify').mockResolvedValue(true);
      jest.spyOn(JWT, 'sign').mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      sessionsRepository.createSession.mockResolvedValue(null);

      await expect(service.login(args)).rejects.toThrow(new InternalServerErrorException('Failed to create session'));
    });
  });

  describe('createRefreshToken', () => {
    it('signs a refresh token using the configured millisecond lifetime', async () => {
      const issuedAt = Math.floor(Date.now() / 1000);
      const token = await service.createRefreshToken('user-1');
      const payload = await JWT.verify<{ sub: string; jti: string; exp?: number }>(token, {
        secret: 'refresh-secret',
      });

      expect(payload.sub).toBe('user-1');
      expect(payload.exp).toBeGreaterThanOrEqual(issuedAt + 43200);
      expect(payload.exp).toBeLessThanOrEqual(issuedAt + 43201);
    });
  });

  describe('refreshToken', () => {
    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'USER',
      createdAt: new Date('2026-02-01T12:00:00Z'),
      updatedAt: null,
      deletedAt: null,
    };

    it('verifies the refresh token, finds the user, and returns rotated tokens', async () => {
      jest.spyOn(service, 'verifyRefreshToken').mockResolvedValue({ sub: user.id, jti: 'token-id' });
      usersRepository.findById.mockResolvedValue(user);
      const createAccessTokenSpy = jest.spyOn(service, 'createAccessToken').mockResolvedValue('new-access-token');
      const createRefreshTokenSpy = jest.spyOn(service, 'createRefreshToken').mockResolvedValue('new-refresh-token');
      const hashSpy = jest
        .spyOn(RefreshTokenHasher, 'hash')
        .mockResolvedValueOnce('old-token-hash')
        .mockResolvedValueOnce('new-token-hash');

      await expect(service.refreshToken('refresh-token')).resolves.toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(service.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(usersRepository.findById).toHaveBeenCalledWith(user.id, expect.anything());
      expect(createAccessTokenSpy).toHaveBeenCalledWith(user.id);
      expect(createRefreshTokenSpy).toHaveBeenCalledWith(user.id);
      expect(hashSpy).toHaveBeenNthCalledWith(1, 'refresh-token');
      expect(hashSpy).toHaveBeenNthCalledWith(2, 'new-refresh-token');
      expect(sessionsRepository.rotateRefreshToken).toHaveBeenCalledWith(
        {
          oldRefreshTokenHash: 'old-token-hash',
          newRefreshTokenHash: 'new-token-hash',
          refreshTokenExpiresAt: expect.any(Date),
        },
        expect.anything(),
      );
    });

    it('throws UnauthorizedException and does not create tokens if the user no longer exists', async () => {
      jest.spyOn(service, 'verifyRefreshToken').mockResolvedValue({ sub: user.id, jti: 'token-id' });
      usersRepository.findById.mockResolvedValue(null);
      const createAccessTokenSpy = jest.spyOn(service, 'createAccessToken');
      const createRefreshTokenSpy = jest.spyOn(service, 'createRefreshToken');

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(new UnauthorizedException('User not found'));

      expect(usersRepository.findById).toHaveBeenCalledWith(user.id, expect.anything());
      expect(createAccessTokenSpy).not.toHaveBeenCalled();
      expect(createRefreshTokenSpy).not.toHaveBeenCalled();
    });

    it('does not look up the user when refresh-token verification fails', async () => {
      const error = new UnauthorizedException('Invalid or expired refresh token');
      jest.spyOn(service, 'verifyRefreshToken').mockRejectedValue(error);

      await expect(service.refreshToken('invalid-refresh-token')).rejects.toBe(error);

      expect(usersRepository.findById).not.toHaveBeenCalled();
    });

    it('rejects a refresh token when its session is missing, expired, or revoked', async () => {
      jest.spyOn(service, 'verifyRefreshToken').mockResolvedValue({ sub: user.id, jti: 'token-id' });
      usersRepository.findById.mockResolvedValue(user);
      sessionsRepository.rotateRefreshToken.mockResolvedValue(null);
      jest.spyOn(service, 'createAccessToken').mockResolvedValue('new-access-token');
      jest.spyOn(service, 'createRefreshToken').mockResolvedValue('new-refresh-token');

      await expect(service.refreshToken('refresh-token')).rejects.toMatchObject({
        response: {
          code: AuthResponseCodes.InvalidCredentials,
          message: 'Invalid or revoked token',
        },
      });
    });
  });

  describe('revokeRefreshToken', () => {
    it('hashes the refresh token and revokes its session', async () => {
      const hashSpy = jest.spyOn(RefreshTokenHasher, 'hash').mockResolvedValue('stored-token-hash');

      await expect(service.revokeRefreshToken('refresh-token')).resolves.toBeUndefined();

      expect(hashSpy).toHaveBeenCalledWith('refresh-token');
      expect(sessionsRepository.revokeSession).toHaveBeenCalledWith('stored-token-hash');
    });

    it('rejects a refresh token when its session cannot be revoked', async () => {
      jest.spyOn(RefreshTokenHasher, 'hash').mockResolvedValue('unknown-token-hash');
      sessionsRepository.revokeSession.mockResolvedValue(false);

      await expect(service.revokeRefreshToken('unknown-token')).rejects.toMatchObject({
        response: {
          code: AuthResponseCodes.InvalidCredentials,
          message: 'Invalid or revoked token',
        },
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('verifies the access token with the configured secret and clock tolerance', async () => {
      const payload = { sub: 'user-1' };
      const verifySpy = jest.spyOn(JWT, 'verify').mockResolvedValue(payload);

      await expect(service.verifyAccessToken('access-token')).resolves.toEqual(payload);
      expect(verifySpy).toHaveBeenCalledWith('access-token', {
        secret: 'access-secret',
        clockTolerance: 5,
      });
    });

    it('translates an invalid access token into an unauthorized exception', async () => {
      jest.spyOn(JWT, 'verify').mockRejectedValue(new InvalidTokenError());

      await expect(service.verifyAccessToken('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired access token'),
      );
    });

    it('rethrows unexpected access-token verification errors', async () => {
      const error = new Error('Verification failed');
      jest.spyOn(JWT, 'verify').mockRejectedValue(error);

      await expect(service.verifyAccessToken('access-token')).rejects.toBe(error);
    });
  });

  describe('verifyRefreshToken', () => {
    it('verifies the refresh token with the configured secret and clock tolerance', async () => {
      const payload = { sub: 'user-1', jti: 'token-id' };
      const verifySpy = jest.spyOn(JWT, 'verify').mockResolvedValue(payload);

      await expect(service.verifyRefreshToken('refresh-token')).resolves.toEqual(payload);
      expect(verifySpy).toHaveBeenCalledWith('refresh-token', {
        secret: 'refresh-secret',
        clockTolerance: 5,
      });
    });

    it('translates an invalid refresh token into an unauthorized exception', async () => {
      jest.spyOn(JWT, 'verify').mockRejectedValue(new InvalidTokenError());

      await expect(service.verifyRefreshToken('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('rethrows unexpected refresh-token verification errors', async () => {
      const error = new Error('Verification failed');
      jest.spyOn(JWT, 'verify').mockRejectedValue(error);

      await expect(service.verifyRefreshToken('refresh-token')).rejects.toBe(error);
    });
  });
});
