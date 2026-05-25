import express from 'express';
import request from 'supertest';
import { createDependencyHealthRouter } from './index';

describe('Dependency health router', () => {
  it('creates a router with default dependency clients', () => {
    expect(createDependencyHealthRouter()).toBeDefined();
  });

  it('GET /database/health returns PostgreSQL health', async () => {
    const app = express();
    const postgres = {
      health: jest.fn().mockResolvedValue({
        status: 'ok',
        now: '2026-05-24T12:00:00.000Z',
      }),
    };

    app.use('/', createDependencyHealthRouter({ postgres }));

    const res = await request(app).get('/database/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      now: '2026-05-24T12:00:00.000Z',
    });
  });

  it('GET /storage/health returns blob storage health', async () => {
    const app = express();
    const blobStorage = {
      health: jest.fn().mockResolvedValue({
        status: 'ok',
        buckets: ['media-uploads'],
      }),
    };

    app.use('/', createDependencyHealthRouter({ blobStorage }));

    const res = await request(app).get('/storage/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      buckets: ['media-uploads'],
    });
  });

  it('passes PostgreSQL health failures to Express error handling', async () => {
    const app = express();
    const postgres = {
      health: jest.fn().mockRejectedValue(new Error('database unavailable')),
    };

    app.use('/', createDependencyHealthRouter({ postgres }));

    const res = await request(app).get('/database/health');

    expect(res.status).toBe(500);
  });

  it('passes blob storage health failures to Express error handling', async () => {
    const app = express();
    const blobStorage = {
      health: jest.fn().mockRejectedValue(new Error('storage unavailable')),
    };

    app.use('/', createDependencyHealthRouter({ blobStorage }));

    const res = await request(app).get('/storage/health');

    expect(res.status).toBe(500);
  });
});
