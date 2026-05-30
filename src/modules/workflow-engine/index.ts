import {
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import cron, { ScheduledTask } from 'node-cron';
import { createModuleLogger } from '../../lib/logger';

const log = createModuleLogger('workflow-engine');

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

@Injectable()
export class WorkflowEngineService implements OnModuleInit, OnModuleDestroy {
  readonly queue = new Queue('workflows', { connection });

  readonly worker = new Worker(
    'workflows',
    /* istanbul ignore next */
    async (job) => {
      log.info(`processing job ${job.id}: ${job.name}`);
    },
    { connection },
  );

  private tasks: ScheduledTask[] = [];

  onModuleInit(): void {
    const tick = cron.schedule(
      '* * * * *',
      /* istanbul ignore next */ () => {
        log.debug('cron tick');
      },
    );
    this.tasks = [tick];
  }

  async onModuleDestroy(): Promise<void> {
    for (const task of this.tasks) {
      task.stop();
    }
    await this.queue.close();
    await this.worker.close();
  }
}

@Module({ providers: [WorkflowEngineService] })
export class WorkflowEngineModule {}
