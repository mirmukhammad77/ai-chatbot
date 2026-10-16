import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard.js';
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class AppModule {}
