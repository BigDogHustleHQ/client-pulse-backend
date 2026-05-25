import { Module } from '@nestjs/common';
import { WebsocketModule } from './modules/websocket';
import { WorkflowEngineModule } from './modules/workflow-engine';
import { IntegrationHubModule } from './modules/integration-hub';
import { DependenciesModule } from './routes/dependencies';

@Module({
  imports: [
    WebsocketModule,
    WorkflowEngineModule,
    IntegrationHubModule,
    DependenciesModule,
  ],
})
export class AppModule {}
