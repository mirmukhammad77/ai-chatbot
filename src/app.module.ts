import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationsModule } from './modules/conversations/conversations.module.ts';
import { DatabaseModule } from './modules/database/database.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { validateEnvConfig } from './shared/configs/env.config.ts';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
