import { jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { type CreateUserDto, type CreateUserResponseDto } from '../../dtos/create-user.dto.js';
import { AuthService } from '../../services/auth.service.js';
import type { LoginResponse } from '../../types/login-responce.js';
import { AuthController } from '../auth.controller.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
    it('calls authService.login and returns its token response', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResponse: LoginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.login.mockResolvedValue(expectedResponse);

      await expect(controller.login(dto)).resolves.toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('propagates exceptions thrown by authService.login', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const error = new Error('Login failed');
      authService.login.mockRejectedValue(error);

      await expect(controller.login(dto)).rejects.toBe(error);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });
});
