import { TenantService } from './tenant.service';
import { TenantStatus } from '../../types/enums/tenant';
import type { PostgresClient } from '../postgres/postgres';

describe('TenantService', () => {
  const findTenantById = jest.fn();
  const updateTenant = jest.fn();
  const insertAuditLog = jest.fn();
  const mockPg = {
    findTenantById,
    updateTenant,
    insertAuditLog,
  } as unknown as PostgresClient;
  const service = new TenantService(mockPg);

  const dbRow = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    created_at: '2026-05-24T12:00:00.000Z',
    updated_at: '2026-05-25T12:00:00.000Z',
  };
  const mappedTenant = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    createdAt: '2026-05-24T12:00:00.000Z',
    updatedAt: '2026-05-25T12:00:00.000Z',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findById', () => {
    it('returns the mapped tenant when found', async () => {
      findTenantById.mockResolvedValue(dbRow);

      await expect(service.findById('tenant-1')).resolves.toEqual(mappedTenant);
      expect(findTenantById).toHaveBeenCalledWith('tenant-1');
    });

    it('returns null when not found', async () => {
      findTenantById.mockResolvedValue(null);

      await expect(service.findById('missing')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates a tenant and writes an audit row', async () => {
      const patch = { name: 'New Name' };
      updateTenant.mockResolvedValue(dbRow);

      await expect(service.update('tenant-1', patch)).resolves.toEqual(
        mappedTenant,
      );

      expect(updateTenant).toHaveBeenCalledWith('tenant-1', patch);
      expect(insertAuditLog).toHaveBeenCalledWith(
        'tenant-1',
        'tenant.updated',
        patch,
      );
    });

    it('returns null and writes no audit row when the tenant does not exist', async () => {
      updateTenant.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'New Name' }),
      ).resolves.toBeNull();

      expect(insertAuditLog).not.toHaveBeenCalled();
    });
  });
});
