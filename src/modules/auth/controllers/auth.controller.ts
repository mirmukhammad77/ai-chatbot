import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserDto, CreateUserResponseDto } from '../dtos/create-user.dto.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() params: CreateUserDto): Promise<CreateUserResponseDto> {
    return await this.authService.register(params);
  }
}
