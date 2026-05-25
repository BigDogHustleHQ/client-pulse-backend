import cron from 'node-cron';
import { WorkflowEngineService } from './index';

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

describe('WorkflowEngineService', () => {
  it('creates a workflow queue named workflows', () => {
    const service = new WorkflowEngineService();
    expect(service.queue).toBeDefined();
    expect(service.queue.name).toBe('workflows');
  });

  it('creates a workflow worker', () => {
    const service = new WorkflowEngineService();
    expect(service.worker).toBeDefined();
  });

  it('schedules a cron tick on init', () => {
    const service = new WorkflowEngineService();
    service.onModuleInit();
    expect(cron.schedule).toHaveBeenCalledWith(
      '* * * * *',
      expect.any(Function),
    );
  });

  it('stops tasks and closes queue and worker on destroy', async () => {
    const task = { stop: jest.fn() };
    (cron.schedule as jest.Mock).mockReturnValueOnce(task);
    const service = new WorkflowEngineService();
    service.onModuleInit();
    await service.onModuleDestroy();
    expect(task.stop).toHaveBeenCalled();
    expect(service.queue.close).toHaveBeenCalled();
    expect(service.worker.close).toHaveBeenCalled();
  });
});
