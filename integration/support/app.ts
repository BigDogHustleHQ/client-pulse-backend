// Boots the real HTTP app with the service-level providers replaced by fakes.
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
import { TenantService } from '../../src/services/tenants/tenant.service';
import { PostgresClient } from '../../src/services/postgres/postgres';
import type { Fakes } from './fakes';

export const createApp = async (fakes: Fakes): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      IntegrationHubModule,
      DependenciesModule,
      TenantsModule,
      StorageModule,
    ],
  })
    .overrideProvider(TenantService)
    .useValue(fakes.tenantService)
    .overrideProvider(PostgresClient)
    .useValue({})
    .overrideProvider(POSTGRES_HEALTH)
    .useValue(fakes.postgresHealth)
    .overrideProvider(BLOB_STORAGE_HEALTH)
    .useValue(fakes.blobStorageHealth)
    .overrideProvider(STORAGE_WRITER)
    .useValue(fakes.storageWriter)
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
};
