/**
 * Boots the real HTTP application for integration tests.
 *
 * Every HTTP-serving module (Integration Hub, Dependencies, Tenants, Storage)
 * is wired exactly as in production — real controllers, services, DTO
 * validation, and the real Postgres/BlobStorage clients — with only the
 * Supabase network boundary replaced by the in-memory fakes. The global
 * ValidationPipe matches main.ts so DTO/enum validation behaves as it does live.
 *
 * The websocket gateway and workflow engine expose no HTTP endpoints (and pull
 * in Socket.io/Redis), so they are intentionally out of scope here and covered
 * by their own unit tests.
 */
import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { IntegrationHubModule } from '../../src/modules/integration-hub';
import { DependenciesModule } from '../../src/routes/dependencies';
import { TenantsModule } from '../../src/routes/tenants';
import { StorageModule } from '../../src/routes/storage';
import {
  BLOB_STORAGE_HEALTH,
  POSTGRES_HEALTH,
} from '../../src/routes/dependencies/types';
import { STORAGE_WRITER } from '../../src/routes/storage/types';
import { PostgresClient } from '../../src/services/postgres/postgres';
import { BlobStorageClient } from '../../src/services/blob-storage/blob-storage';
import type { Fakes } from './fakes';

export const createApp = async (fakes: Fakes): Promise<INestApplication> => {
  // Real clients, constructed exactly like production but pointed at the
  // in-memory adapters instead of a live Supabase project.
  const postgres = new PostgresClient({ client: fakes.postgres.asAdapter() });
  const storage = new BlobStorageClient({ client: fakes.storage.asAdapter() });

  const moduleRef = await Test.createTestingModule({
    imports: [
      IntegrationHubModule,
      DependenciesModule,
      TenantsModule,
      StorageModule,
    ],
  })
    // Tenants: TenantService depends on the real PostgresClient.
    .overrideProvider(PostgresClient)
    .useValue(postgres)
    // Dependencies: health probes call the real clients.
    .overrideProvider(POSTGRES_HEALTH)
    .useValue({ health: () => postgres.health() })
    .overrideProvider(BLOB_STORAGE_HEALTH)
    .useValue({ health: () => storage.health() })
    // Storage: the writer delegates to the real BlobStorageClient.
    .overrideProvider(STORAGE_WRITER)
    .useValue({
      upload: (input: Parameters<BlobStorageClient['upload']>[0]) =>
        storage.upload(input),
      remove: (bucket: string, paths: string[]) =>
        storage.remove(bucket, paths),
      list: (bucket: string, prefix?: string) => storage.list(bucket, prefix),
      createSignedUrl: (bucket: string, path: string, expiresIn: number) =>
        storage.createSignedUrl(bucket, path, expiresIn),
    })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
};
