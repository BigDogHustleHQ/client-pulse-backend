import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DependenciesModule } from './index';
import { BLOB_STORAGE_HEALTH, POSTGRES_HEALTH } from './types';

describe('Dependencies controller', () => {
  let app: INestApplication;
  const postgresHealth = jest.fn();
  const blobStorageHealth = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DependenciesModule],
    })
      .overrideProvider(POSTGRES_HEALTH)
      .useValue({ health: postgresHealth })
      .overrideProvider(BLOB_STORAGE_HEALTH)
      .useValue({ health: blobStorageHealth })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await app.close();
  });

  it('GET /dependencies/database/health returns PostgreSQL health', async () => {
    postgresHealth.mockResolvedValue({
      status: 'ok',
      now: '2026-05-24T12:00:00.000Z',
    });

    const res = await request(app.getHttpServer()).get(
      '/dependencies/database/health',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      now: '2026-05-24T12:00:00.000Z',
    });
  });

  it('GET /dependencies/storage/health returns blob storage health', async () => {
    blobStorageHealth.mockResolvedValue({
      status: 'ok',
      buckets: ['media-uploads'],
    });

    const res = await request(app.getHttpServer()).get(
      '/dependencies/storage/health',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      buckets: ['media-uploads'],
    });
  });

  it('returns 500 when PostgreSQL health fails', async () => {
    postgresHealth.mockRejectedValue(new Error('database unavailable'));

    const res = await request(app.getHttpServer()).get(
      '/dependencies/database/health',
    );

    expect(res.status).toBe(500);
  });

  it('returns 500 when blob storage health fails', async () => {
    blobStorageHealth.mockRejectedValue(new Error('storage unavailable'));

    const res = await request(app.getHttpServer()).get(
      '/dependencies/storage/health',
    );

    expect(res.status).toBe(500);
  });
});
