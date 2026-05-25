import { createApp } from './server';

jest.mock('./modules/websocket', () => ({
  createWebSocketModule: jest.fn().mockReturnValue({ close: jest.fn() }),
}));

jest.mock('./modules/workflow-engine', () => ({
  createIntegrationHubRouter: jest.fn(),
  registerCronJobs: jest.fn(),
  workflowQueue: { name: 'workflows', close: jest.fn() },
  workflowWorker: { close: jest.fn() },
}));

jest.mock('./modules/integration-hub', () => ({
  createIntegrationHubRouter: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('./routes/dependencies', () => ({
  createDependencyHealthRouter: jest.fn().mockReturnValue(jest.fn()),
}));

describe('server', () => {
  it('creates an http server', () => {
    const server = createApp();
    expect(server).toBeDefined();
    server.close();
  });
});
