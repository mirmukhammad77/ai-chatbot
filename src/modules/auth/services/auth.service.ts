import { ConflictException, Injectable } from '@nestjs/common';
import { AuthResponceCodes } from '../../../shared/http/responce-codes.ts/auth-response-codes.js';
import { Hasher } from '../../../shared/libs/hasher.lib.js';
import { type CreateUserParams, UsersRepository } from '../../users/repositories/users.repository.js';
import { CreateUserResponseDto } from '../dtos/create-user.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
}
