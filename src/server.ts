import { Module } from '@nestjs/common';
import { WebsocketModule } from './modules/websocket';
import { WorkflowEngineModule } from './modules/workflow-engine';
import { IntegrationHubModule } from './modules/integration-hub';
import { DependenciesModule } from './routes/dependencies';
import { TenantsModule } from './routes/tenants';
import { StorageModule } from './routes/storage';

@Module({
  imports: [
    WebsocketModule,
    WorkflowEngineModule,
    IntegrationHubModule,
    DependenciesModule,
    TenantsModule,
    StorageModule,
  ],
})
export class AppModule {}
