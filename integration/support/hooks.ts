/**
 * Per-scenario lifecycle: boot a fresh app with fresh fakes before each
 * scenario and tear it down afterwards, keeping scenarios isolated.
 */
import { Before, After } from '@cucumber/cucumber';
import { createApp } from './app';
import { createFakes } from './fakes';
import type { IntegrationWorld } from './world';

Before(async function (this: IntegrationWorld) {
  this.fakes = createFakes();
  this.app = await createApp(this.fakes);
});

After(async function (this: IntegrationWorld) {
  if (this.app) {
    await this.app.close();
    this.app = undefined;
  }
});
