import { createServer } from 'http';
import express from 'express';
import { createWebSocketModule } from './modules/websocket';
import { createIntegrationHubRouter } from './modules/integration-hub';
import { createPlatformRouter } from './modules/platform';
import { registerCronJobs } from './modules/workflow-engine';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/integrations', createIntegrationHubRouter());
  app.use('/platform', createPlatformRouter());

  const httpServer = createServer(app);

  createWebSocketModule(httpServer);
  registerCronJobs();

  return httpServer;
}
