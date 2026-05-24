import { registerCronJobs } from './index';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    name: 'workflows',
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn().mockImplementation((_name: string, processor: unknown) => ({
    processor,
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('node-cron', () => ({
  default: {
    schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
  },
  schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

describe('Workflow Engine module', () => {
  it('registers cron jobs without throwing', () => {
    expect(() => registerCronJobs()).not.toThrow();
  });

  it('returns scheduled tasks', () => {
    const tasks = registerCronJobs();
    expect(tasks).toHaveLength(1);
  });

  it('exports a workflow queue', async () => {
    const { workflowQueue } = await import('./index');
    expect(workflowQueue).toBeDefined();
    expect(workflowQueue.name).toBe('workflows');
  });

  it('exports a workflow worker', async () => {
    const { workflowWorker } = await import('./index');
    expect(workflowWorker).toBeDefined();
  });
});
