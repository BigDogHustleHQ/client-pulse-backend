import { Router } from 'express';
import { createModuleLogger } from '../../lib/logger';

const log = createModuleLogger('integration-hub');

export function createIntegrationHubRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Webhook receiver — individual integration adapters will register here
  router.post('/webhooks/:provider', (req, res) => {
    const { provider } = req.params;
    log.info(`webhook received from ${provider}`);
    res.sendStatus(200);
  });

  return router;
}
