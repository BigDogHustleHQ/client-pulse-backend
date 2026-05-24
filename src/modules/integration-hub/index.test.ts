import express from 'express';
import request from 'supertest';
import { createIntegrationHubRouter } from './index';

const app = express();
app.use(express.json());
app.use('/', createIntegrationHubRouter());

describe('Integration Hub router', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /webhooks/:provider handles webhook', async () => {
    const res = await request(app).post('/webhooks/stripe').send({});
    expect(res.status).toBe(200);
  });
});
