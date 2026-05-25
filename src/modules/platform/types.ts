import type { PostgresClient } from '../data/postgres';
import type { BlobStorageClient } from '../storage/blob-storage';

export interface PlatformRouterOptions {
  postgres?: Pick<PostgresClient, 'health'>;
  blobStorage?: Pick<BlobStorageClient, 'health'>;
}
