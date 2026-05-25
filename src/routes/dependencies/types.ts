import type { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import type { PostgresClient } from '../../services/postgres/postgres';

export interface DependencyHealthRouterOptions {
  postgres?: Pick<PostgresClient, 'health'>;
  blobStorage?: Pick<BlobStorageClient, 'health'>;
}
