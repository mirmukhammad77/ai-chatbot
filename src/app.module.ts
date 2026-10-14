import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { validateEnvConfig } from './shared/configs/env.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvConfig,
    }),
    DatabaseModule,
    UsersModule,
    ConversationsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_PIPE, useFactory: () => new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) },
  ],
})
export class AppModule {}
