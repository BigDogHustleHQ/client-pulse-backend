import { Router } from 'express';

export function createIntegrationHubRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Webhook receiver — individual integration adapters will register here
  router.post('/webhooks/:provider', (req, res) => {
    const { provider } = req.params;
    console.log(`[integration-hub] webhook received from ${provider}`);
    res.sendStatus(200);
  });

  return router;
}
