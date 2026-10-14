import { jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthResponceCodes } from '../../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../../shared/libs/hasher.lib.js';
import { type User } from '../../../users/entities/index.js';
import { UsersRepository } from '../../../users/repositories/users.repository.js';
import { AuthService } from '../auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
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
});
