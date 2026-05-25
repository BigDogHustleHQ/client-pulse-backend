import { Router } from 'express';
import { PostgresClient } from '../data/postgres';
import { BlobStorageClient } from '../storage/blob-storage';
import type { PlatformRouterOptions } from './types';

export function createPlatformRouter(
  options: PlatformRouterOptions = {},
): Router {
  const router = Router();

  router.get('/database/health', async (_req, res, next) => {
    try {
      /* istanbul ignore next */
      const postgres = options.postgres ?? new PostgresClient();
      res.json(await postgres.health());
    } catch (error) {
      next(error);
    }
  });

  router.get('/storage/health', async (_req, res, next) => {
    try {
      /* istanbul ignore next */
      const blobStorage = options.blobStorage ?? new BlobStorageClient();
      res.json(await blobStorage.health());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
