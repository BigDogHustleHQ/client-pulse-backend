import { Router } from 'express';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { PostgresClient } from '../../services/postgres/postgres';
import type { DependencyHealthRouterOptions } from './types';

export const createDependencyHealthRouter = (
  options: DependencyHealthRouterOptions = {},
): Router => {
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
};
