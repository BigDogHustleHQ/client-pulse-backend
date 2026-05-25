import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { IntegrationHubController } from './index';

describe('Integration Hub controller', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IntegrationHubController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /integrations/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/integrations/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /integrations/webhooks/:provider handles webhook', async () => {
    const res = await request(app.getHttpServer())
      .post('/integrations/webhooks/stripe')
      .send({});
    expect(res.status).toBe(200);
  });
});
