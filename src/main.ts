import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { type EnvConfig } from './shared/configs/env.config.js';
import { ValidatorConfig } from './shared/configs/validator.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const configService = app.get(ConfigService<EnvConfig, true>);

  app.useGlobalPipes(ValidatorConfig);

  const appPort = configService.get('PORT', { infer: true });
  await app.listen(appPort, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${appPort}`);
  });
}
await bootstrap();
