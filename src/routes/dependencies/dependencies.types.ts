import type { DatabaseHealth } from '../../services/postgres/postgres.types';
import type { BlobStorageHealth } from '../../services/blob-storage/blob-storage.types';

export interface DependencyHealthCheck<T> {
  health(): Promise<T>;
}

export const POSTGRES_HEALTH = 'POSTGRES_HEALTH';
export const BLOB_STORAGE_HEALTH = 'BLOB_STORAGE_HEALTH';

export type PostgresHealthCheck = DependencyHealthCheck<DatabaseHealth>;
export type BlobStorageHealthCheck = DependencyHealthCheck<BlobStorageHealth>;
