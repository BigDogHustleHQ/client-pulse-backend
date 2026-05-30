/**
 * Cucumber World: per-scenario state shared across step definitions.
 *
 * Each scenario gets a fresh app boot with fresh in-memory fakes (see hooks.ts),
 * so scenarios are fully isolated.
 */
import {
  setWorldConstructor,
  World,
  type IWorldOptions,
} from '@cucumber/cucumber';
import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import { createFakes, type Fakes } from './fakes';

export class IntegrationWorld extends World {
  app?: INestApplication;
  fakes: Fakes = createFakes();
  response?: Response;

  constructor(options: IWorldOptions) {
    super(options);
  }

  get server(): ReturnType<INestApplication['getHttpServer']> {
    if (!this.app) {
      throw new Error('App has not been started for this scenario');
    }
    return this.app.getHttpServer();
  }
}

setWorldConstructor(IntegrationWorld);
