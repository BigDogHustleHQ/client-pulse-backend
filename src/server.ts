import { Module } from '@nestjs/common';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { WorkflowEngineModule } from './modules/workflow-engine/workflow-engine.module';
import { IntegrationHubModule } from './modules/integration-hub/integration-hub.module';
import { DependenciesModule } from './routes/dependencies/dependencies.module';
import { TenantsModule } from './routes/tenants/tenants.module';
import { StorageModule } from './routes/storage/storage.module';
import { AuthModule } from './lib/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    WebsocketModule,
    WorkflowEngineModule,
    IntegrationHubModule,
    DependenciesModule,
    TenantsModule,
    StorageModule,
  ],
})
export class AppModule {}
