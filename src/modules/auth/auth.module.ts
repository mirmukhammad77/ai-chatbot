import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';

@Module({
  providers: [AuthService],
  imports: [UsersModule],
  controllers: [AuthController],
})
export class AuthModule {}
