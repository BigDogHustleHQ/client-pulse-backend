import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './server';
import { createModuleLogger } from './lib/logger/logger';

const log = createModuleLogger('server');
const PORT = process.env.PORT ?? 3001;

/* istanbul ignore next */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(PORT);
  log.info(`listening on port ${PORT}`);
};

/* istanbul ignore next */
void bootstrap();
