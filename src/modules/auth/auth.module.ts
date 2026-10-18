import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';

@Module({
  providers: [AuthService],
  imports: [UsersModule, SessionsModule, DatabaseModule],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
