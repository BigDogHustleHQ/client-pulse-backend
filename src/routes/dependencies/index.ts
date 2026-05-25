import { Controller, Get, Inject, Module } from '@nestjs/common';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { PostgresClient } from '../../services/postgres/postgres';
import type { BlobStorageHealth } from '../../services/blob-storage/types';
import type { DatabaseHealth } from '../../services/postgres/types';
import {
  BLOB_STORAGE_HEALTH,
  POSTGRES_HEALTH,
  type BlobStorageHealthCheck,
  type PostgresHealthCheck,
} from './types';

@Controller('dependencies')
export class DependenciesController {
  constructor(
    @Inject(POSTGRES_HEALTH) private readonly postgres: PostgresHealthCheck,
    @Inject(BLOB_STORAGE_HEALTH)
    private readonly blobStorage: BlobStorageHealthCheck,
  ) {}

  @Get('database/health')
  async databaseHealth(): Promise<DatabaseHealth> {
    return this.postgres.health();
  }

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
          new PostgresClient().health(),
      },
    },
    {
      provide: BLOB_STORAGE_HEALTH,
      useValue: {
        health: /* istanbul ignore next */ (): Promise<BlobStorageHealth> =>
          new BlobStorageClient().health(),
      },
    },
  ],
})
export class DependenciesModule {}
