import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { type UserRoleType } from '../../users/entities/index.js';

export class CreateUserDto {
  @IsString({ message: 'Email must be a string' })
  @IsEmail(undefined, { message: 'Must be valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  password: string;
}

export class CreateUserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRoleType;
  createdAt: Date;
}
