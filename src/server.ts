import { createServer } from 'http';
import express from 'express';
import { createWebSocketModule } from './modules/websocket';
import { createIntegrationHubRouter } from './modules/integration-hub';
import { createDependencyHealthRouter } from './routes/dependencies';
import { registerCronJobs } from './modules/workflow-engine';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/integrations', createIntegrationHubRouter());
  app.use('/dependencies', createDependencyHealthRouter());

  const httpServer = createServer(app);

  createWebSocketModule(httpServer);
  registerCronJobs();

  return httpServer;
};
