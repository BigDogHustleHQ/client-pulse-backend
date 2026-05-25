import { TenantService } from './tenant.service';
import { TenantStatus } from '../../types/enums/tenant';
import type { PostgresClient } from '../postgres/postgres';

describe('TenantService', () => {
  const query = jest.fn();
  const mockPg = { query } as unknown as PostgresClient;
  const service = new TenantService(mockPg);

  const createdAt = new Date('2026-05-24T12:00:00.000Z');
  const updatedAt = new Date('2026-05-25T12:00:00.000Z');
  const dbRow = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    created_at: createdAt,
    updated_at: updatedAt,
  };
  const mappedTenant = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findById', () => {
    it('returns the mapped tenant when found', async () => {
      query.mockResolvedValue({ rows: [dbRow], rowCount: 1 });

      await expect(service.findById('tenant-1')).resolves.toEqual(mappedTenant);
      expect(query.mock.calls[0]).toEqual([
        'select id, name, slug, status, created_at, updated_at from tenants where id = $1',
        ['tenant-1'],
      ]);
    });

    it('returns null when not found', async () => {
      query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.findById('missing')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates a single field (name) and writes an audit row', async () => {
      query
        .mockResolvedValueOnce({ rows: [dbRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(
        service.update('tenant-1', { name: 'New Name' }),
      ).resolves.toEqual(mappedTenant);

      expect(query.mock.calls[0]).toEqual([
        'update tenants set name = $1, updated_at = now() where id = $2 returning id, name, slug, status, created_at, updated_at',
        ['New Name', 'tenant-1'],
      ]);
      expect(query.mock.calls[1]).toEqual([
        'insert into audit_logs (tenant_id, action, metadata) values ($1, $2, $3)',
        ['tenant-1', 'tenant.updated', JSON.stringify({ name: 'New Name' })],
      ]);
    });

    it('updates the slug field', async () => {
      query
        .mockResolvedValueOnce({ rows: [dbRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.update('tenant-1', { slug: 'new-slug' });

      expect(query.mock.calls[0]).toEqual([
        'update tenants set slug = $1, updated_at = now() where id = $2 returning id, name, slug, status, created_at, updated_at',
        ['new-slug', 'tenant-1'],
      ]);
    });

    it('updates the status field', async () => {
      query
        .mockResolvedValueOnce({ rows: [dbRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await service.update('tenant-1', { status: TenantStatus.Suspended });

      expect(query.mock.calls[0]).toEqual([
        'update tenants set status = $1, updated_at = now() where id = $2 returning id, name, slug, status, created_at, updated_at',
        [TenantStatus.Suspended, 'tenant-1'],
      ]);
    });

    it('updates multiple fields with sequential placeholders', async () => {
      query
        .mockResolvedValueOnce({ rows: [dbRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const patch = {
        name: 'New Name',
        slug: 'new-slug',
        status: TenantStatus.Suspended,
      };
      await service.update('tenant-1', patch);

      expect(query.mock.calls[0]).toEqual([
        'update tenants set name = $1, slug = $2, status = $3, updated_at = now() where id = $4 returning id, name, slug, status, created_at, updated_at',
        ['New Name', 'new-slug', TenantStatus.Suspended, 'tenant-1'],
      ]);
      expect(query.mock.calls[1]).toEqual([
        'insert into audit_logs (tenant_id, action, metadata) values ($1, $2, $3)',
        ['tenant-1', 'tenant.updated', JSON.stringify(patch)],
      ]);
    });

    it('returns null and writes no audit row when the tenant does not exist', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        service.update('missing', { name: 'New Name' }),
      ).resolves.toBeNull();

      expect(query).toHaveBeenCalledTimes(1);
    });
  });
});
