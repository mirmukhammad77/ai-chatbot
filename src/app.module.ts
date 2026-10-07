import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationsModule } from './modules/conversations/conversations.module.ts';
import { DatabaseModuleTsModule } from './modules/database/database.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { validateEnvConfig } from './shared/configs/env.config.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvConfig,
    }),
    DatabaseModuleTsModule,
    UsersModule,
    ConversationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
