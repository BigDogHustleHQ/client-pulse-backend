import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Module,
  Param,
  Post,
} from '@nestjs/common';
import { createModuleLogger } from '../../lib/logger/logger';

const log = createModuleLogger('integration-hub');

@Controller('integrations')
export class IntegrationHubController {
  // Uptime probe for the integration hub — lets monitoring/Railway confirm the
  // service is ready to accept third-party events before routing traffic to it.
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  // Inbound webhook intake from connected providers (Stripe, Twilio, OpenTable,
  // Square, Yelp, …). Each provider's events — payments, reservations, reviews,
  // messages — arrive here to trigger ClientPulse automations. Adapters per
  // provider slug will register here.
  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  webhook(@Param('provider') provider: string): void {
    log.info(`webhook received from ${provider}`);
  }
}

@Module({ controllers: [IntegrationHubController] })
export class IntegrationHubModule {}
