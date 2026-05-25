import { Controller, Get, HttpCode, HttpStatus, Module, Param, Post } from '@nestjs/common';
import { createModuleLogger } from '../../lib/logger';

const log = createModuleLogger('integration-hub');

@Controller('integrations')
export class IntegrationHubController {
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  // Webhook receiver — individual integration adapters will register here
  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  webhook(@Param('provider') provider: string): void {
    log.info(`webhook received from ${provider}`);
  }
}

@Module({ controllers: [IntegrationHubController] })
export class IntegrationHubModule {}
