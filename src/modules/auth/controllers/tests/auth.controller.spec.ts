import { jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import type { EnvConfig } from '../../../../shared/configs/env.config.js';
import { type CreateUserDto, type CreateUserResponseDto } from '../../dtos/create-user.dto.js';
import { AuthService } from '../../services/auth.service.js';
import type { LoginResponse } from '../../types/login-responce.js';
import { AuthController } from '../auth.controller.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  const defaultRefreshMaxAge = 604800000;

  const createMockResponse = () =>
    ({
      cookie: jest.fn(),
    }) as unknown as Response;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_REFRESH_COOKIE_MAX_AGE_MS') {
          return defaultRefreshMaxAge;
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize refreshMaxAge when config returns a number', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue(10000),
      } as unknown as ConfigService<EnvConfig, true>;

      const instance = new AuthController(authService, mockConfig);
      const res = createMockResponse();
      instance.setAuthCookies(res, 'refresh-token', 'csrf-token');

      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.objectContaining({ maxAge: 10000 }));
    });

    it('should convert refreshMaxAge to number when config returns a string', () => {
      const mockConfig = {
        get: jest.fn().mockReturnValue('20000'),
      } as unknown as ConfigService<EnvConfig, true>;

      const instance = new AuthController(authService, mockConfig);
      const res = createMockResponse();
      instance.setAuthCookies(res, 'refresh-token', 'csrf-token');

      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.objectContaining({ maxAge: 20000 }));
    });
  });

  describe('register', () => {
    it('should call authService.register and return the created user response', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: CreateUserResponseDto = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        role: 'USER',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      authService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate exceptions thrown by authService.register', async () => {
      const dto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      authService.register.mockRejectedValue(new ConflictException('User already exists'));

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('calls authService.login, sets auth cookies, and returns user data without refreshToken', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const loginResponse: LoginResponse = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.login.mockResolvedValue(loginResponse);

      const mockRes = createMockResponse();
      const setAuthCookiesSpy = jest.spyOn(controller, 'setAuthCookies');
      const generateCsrfTokenSpy = jest.spyOn(controller, 'generateCsrfToken').mockReturnValue('mocked-csrf-token');

      const result = await controller.login(dto, mockRes);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(generateCsrfTokenSpy).toHaveBeenCalledTimes(1);
      expect(setAuthCookiesSpy).toHaveBeenCalledWith(mockRes, 'refresh-token', 'mocked-csrf-token');
      expect(result).toEqual({
        id: 'user-uuid-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        accessToken: 'access-token',
      });
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('propagates exceptions thrown by authService.login and does not set cookies', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const error = new Error('Login failed');
      authService.login.mockRejectedValue(error);
      const mockRes = createMockResponse();

      await expect(controller.login(dto, mockRes)).rejects.toBe(error);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when the refresh token is missing', async () => {
      const mockRes = createMockResponse();

      await expect(controller.refreshToken(null, 'csrf-token', mockRes)).rejects.toThrow(
        new UnauthorizedException('missing refresh token'),
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the CSRF token is missing', async () => {
      const mockRes = createMockResponse();

      await expect(controller.refreshToken('refresh-token', null, mockRes)).rejects.toThrow(
        new UnauthorizedException('missing csrf token'),
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });

    it('calls authService.refreshToken, rotates auth cookies, and returns the new access token', async () => {
      authService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      const mockRes = createMockResponse();
      const setAuthCookiesSpy = jest.spyOn(controller, 'setAuthCookies');
      const generateCsrfTokenSpy = jest.spyOn(controller, 'generateCsrfToken').mockReturnValue('new-csrf-token');

      const result = await controller.refreshToken('old-refresh-token', 'old-csrf-token', mockRes);

      expect(authService.refreshToken).toHaveBeenCalledTimes(1);
      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(generateCsrfTokenSpy).toHaveBeenCalledTimes(1);
      expect(setAuthCookiesSpy).toHaveBeenCalledWith(mockRes, 'new-refresh-token', 'new-csrf-token');
      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('propagates exceptions thrown by authService.refreshToken and does not set cookies', async () => {
      const error = new UnauthorizedException('Invalid or expired refresh token');
      authService.refreshToken.mockRejectedValue(error);
      const mockRes = createMockResponse();

      await expect(controller.refreshToken('invalid-refresh-token', 'csrf-token', mockRes)).rejects.toBe(error);
      expect(authService.refreshToken).toHaveBeenCalledWith('invalid-refresh-token');
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('setAuthCookies', () => {
    it('should set refresh_token and csrf_token cookies with expected options and maxAge', () => {
      const mockRes = createMockResponse();
      const refreshToken = 'sample-refresh-token';
      const csrfToken = 'sample-csrf-token';

      controller.setAuthCookies(mockRes, refreshToken, csrfToken);

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenNthCalledWith(1, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: defaultRefreshMaxAge,
      });
      expect(mockRes.cookie).toHaveBeenNthCalledWith(2, 'csrf_token', csrfToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        maxAge: defaultRefreshMaxAge,
      });
    });
  });

  describe('logout', () => {
    it('throws UnauthorizedException when the refresh token is missing', async () => {
      const mockRes = createMockResponse();

      await expect(controller.logout(null, 'csrf-token', mockRes)).rejects.toThrow(
        new UnauthorizedException('missing refresh token'),
      );
      expect(authService.revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the CSRF token is missing', async () => {
      const mockRes = createMockResponse();

      await expect(controller.logout('refresh-token', null, mockRes)).rejects.toThrow(
        new UnauthorizedException('missing csrf token'),
      );
      expect(authService.revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('revokes the refresh token and clears both auth cookies', async () => {
      const mockRes = {
        ...createMockResponse(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await controller.logout('refresh-token', 'csrf-token', mockRes);

      expect(authService.revokeRefreshToken).toHaveBeenCalledTimes(1);
      expect(authService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(1, 'refresh_token');
      expect(mockRes.clearCookie).toHaveBeenNthCalledWith(2, 'csrf_token');
    });

    it('propagates revocation failures without clearing cookies', async () => {
      const error = new UnauthorizedException('Invalid or revoked token');
      authService.revokeRefreshToken.mockRejectedValue(error);
      const mockRes = {
        ...createMockResponse(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await expect(controller.logout('refresh-token', 'csrf-token', mockRes)).rejects.toBe(error);

      expect(mockRes.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('generateCsrfToken', () => {
    it('should return a 64-character hexadecimal string', () => {
      const token = controller.generateCsrfToken();

      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return different tokens on successive invocations', () => {
      const token1 = controller.generateCsrfToken();
      const token2 = controller.generateCsrfToken();

      expect(token1).not.toBe(token2);
    });
  });
});
