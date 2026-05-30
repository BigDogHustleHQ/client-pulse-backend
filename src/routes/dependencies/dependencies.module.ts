import { Controller, Get, Inject, Module } from '@nestjs/common';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { PostgresClient } from '../../services/postgres/postgres';
import type { BlobStorageHealth } from '../../services/blob-storage/blob-storage.types';
import type { DatabaseHealth } from '../../services/postgres/postgres.types';
import {
  BLOB_STORAGE_HEALTH,
  POSTGRES_HEALTH,
  type BlobStorageHealthCheck,
  type PostgresHealthCheck,
} from './dependencies.types';

// Lazily constructed once and reused — building a client reads env and opens a
// Supabase connection, so we don't want a fresh one per health probe.
let postgresClient: PostgresClient | undefined;
/* istanbul ignore next */
const getPostgresClient = (): PostgresClient =>
  (postgresClient ??= new PostgresClient());

let blobStorageClient: BlobStorageClient | undefined;
/* istanbul ignore next */
const getBlobStorageClient = (): BlobStorageClient =>
  (blobStorageClient ??= new BlobStorageClient());

@Controller('dependencies')
export class DependenciesController {
  constructor(
    @Inject(POSTGRES_HEALTH) private readonly postgres: PostgresHealthCheck,
    @Inject(BLOB_STORAGE_HEALTH)
    private readonly blobStorage: BlobStorageHealthCheck,
  ) {}

  // Readiness check for the tenant database (Supabase Postgres). Surfaced on
  // status dashboards and used as a deploy/health gate before serving traffic.
  @Get('database/health')
  async databaseHealth(): Promise<DatabaseHealth> {
    return this.postgres.health();
  }

  // Readiness check for blob storage (customer media uploads + AI-generated
  // sites). Confirms the Supabase service-role credentials are valid.
  @Get('storage/health')
  async storageHealth(): Promise<BlobStorageHealth> {
    return this.blobStorage.health();
  }
}

@Module({
  controllers: [DependenciesController],
  providers: [
    {
      provide: POSTGRES_HEALTH,
      useValue: {
        health: /* istanbul ignore next */ (): Promise<DatabaseHealth> =>
          getPostgresClient().health(),
      },
    },
    {
      provide: BLOB_STORAGE_HEALTH,
      useValue: {
        health: /* istanbul ignore next */ (): Promise<BlobStorageHealth> =>
          getBlobStorageClient().health(),
      },
    },
  ],
})
export class DependenciesModule {}
