import { jest } from '@jest/globals';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../../shared/decorators/public.decorator.js';
import { type User } from '../../../users/entities/index.js';
import { type UsersRepository } from '../../../users/repositories/users.repository.js';
import { type AuthService } from '../../services/auth.service.js';
import { type AuthRequest } from '../../types/auth.request.js';
import { AccessTokenGuard } from '../access-token.guard.js';

describe('AccessTokenGuard', () => {
  const user: User = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-password',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'USER',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: null,
    deletedAt: null,
  };

  let guard: AccessTokenGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let authService: { verifyAccessToken: jest.Mock<(token: string) => Promise<{ sub: string }>> };
  let usersRepository: { findById: jest.Mock<(id: string) => Promise<User | null>> };

  const createContext = (authorization?: string) => {
    const request: Partial<AuthRequest> = { headers: { authorization } } as AuthRequest;
    const getRequest = jest.fn().mockReturnValue(request);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getRequest }),
    } as unknown as ExecutionContext;

    return { context, request, getRequest };
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    authService = { verifyAccessToken: jest.fn<(token: string) => Promise<{ sub: string }>>() };
    usersRepository = { findById: jest.fn<(id: string) => Promise<User | null>>() };
    guard = new AccessTokenGuard(
      reflector as unknown as Reflector,
      authService as unknown as AuthService,
      usersRepository as unknown as UsersRepository,
    );
  });

  it('allows public routes without reading the request', async () => {
    const { context } = createContext();
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    expect(context.switchToHttp).not.toHaveBeenCalled();
    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects requests without an authorization header', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is missing', 'unauthorized'),
    );
    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it.each(['Basic token', 'Bearer'])('rejects malformed bearer headers: %s', async (authorization) => {
    const { context } = createContext(authorization);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header must use bearer token', 'unauthorized'),
    );
    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('verifies the bearer token, loads the user, and attaches the user to the request', async () => {
    const { context, request } = createContext('Bearer valid-token');
    authService.verifyAccessToken.mockResolvedValue({ sub: user.id });
    usersRepository.findById.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(usersRepository.findById).toHaveBeenCalledWith(user.id);
    expect(request.user).toEqual(user);
  });

  it('rejects a valid token when its user no longer exists', async () => {
    const { context } = createContext('Bearer valid-token');
    authService.verifyAccessToken.mockResolvedValue({ sub: user.id });
    usersRepository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('User associated with this token was not found', 'unauthorized'),
    );
  });

  it('propagates access-token verification errors without querying for a user', async () => {
    const { context } = createContext('Bearer invalid-token');
    const error = new UnauthorizedException('Invalid or expired access token');
    authService.verifyAccessToken.mockRejectedValue(error);

    await expect(guard.canActivate(context)).rejects.toBe(error);
    expect(usersRepository.findById).not.toHaveBeenCalled();
  });
});
