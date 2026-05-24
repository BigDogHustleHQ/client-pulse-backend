import { Queue, Worker } from 'bullmq';
import cron, { ScheduledTask } from 'node-cron';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const workflowQueue = new Queue('workflows', { connection });

export const workflowWorker = new Worker(
  'workflows',
  /* istanbul ignore next */
  async (job) => {
    console.log(`[workflow-engine] processing job ${job.id}: ${job.name}`);
  },
  { connection },
);

export function registerCronJobs(): ScheduledTask[] {
  const tick = cron.schedule('* * * * *', /* istanbul ignore next */ () => {
    console.log('[workflow-engine] cron tick');
  });
  return [tick];
}
