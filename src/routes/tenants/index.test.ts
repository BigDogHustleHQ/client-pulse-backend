import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TenantsModule } from './index';
import { TenantService } from '../../services/tenants/tenant.service';
import { PostgresClient } from '../../services/postgres/postgres';
import { TenantStatus } from '../../types/enums/tenant';

describe('Tenants controller', () => {
  let app: INestApplication;
  const findById = jest.fn();
  const update = jest.fn();

  const tenant = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    createdAt: '2026-05-24T12:00:00.000Z',
    updatedAt: '2026-05-25T12:00:00.000Z',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TenantsModule],
    })
      .overrideProvider(TenantService)
      .useValue({ findById, update })
      .overrideProvider(PostgresClient)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await app.close();
  });

  it('GET /tenants/:id returns the tenant', async () => {
    findById.mockResolvedValue(tenant);

    const res = await request(app.getHttpServer()).get('/tenants/tenant-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(tenant);
    expect(findById).toHaveBeenCalledWith('tenant-1');
  });

  it('GET /tenants/:id returns 404 when missing', async () => {
    findById.mockResolvedValue(null);

    const res = await request(app.getHttpServer()).get('/tenants/missing');

    expect(res.status).toBe(404);
  });

  it('PATCH /tenants/:id updates the tenant', async () => {
    update.mockResolvedValue(tenant);

    const res = await request(app.getHttpServer())
      .patch('/tenants/tenant-1')
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(tenant);
    expect(update).toHaveBeenCalledWith('tenant-1', { name: 'New Name' });
  });

  it('PATCH /tenants/:id returns 400 for an empty body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/tenants/tenant-1')
      .send({});

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('PATCH /tenants/:id returns 400 for an invalid status', async () => {
    const res = await request(app.getHttpServer())
      .patch('/tenants/tenant-1')
      .send({ status: 'archived' });

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('PATCH /tenants/:id returns 404 when the tenant does not exist', async () => {
    update.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .patch('/tenants/missing')
      .send({ status: TenantStatus.Suspended });

    expect(res.status).toBe(404);
  });
});
