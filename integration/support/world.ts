// Cucumber World + per-scenario lifecycle. Each scenario gets a fresh app and
// fresh fakes, so scenarios are isolated.
import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import { createApp } from './app';
import { Fakes } from './fakes';

export class IntegrationWorld extends World {
  app!: INestApplication;
  fakes = new Fakes();
  response?: Response;

  get server() {
    return this.app.getHttpServer();
  }
}

setWorldConstructor(IntegrationWorld);

Before(async function (this: IntegrationWorld) {
  this.fakes = new Fakes();
  this.app = await createApp(this.fakes);
});

After(async function (this: IntegrationWorld) {
  await this.app?.close();
});
