import { PostgresClient } from './postgres';
import { TenantStatus } from '../../types/enums/tenant';

describe('PostgresClient', () => {
  const select = jest.fn();
  const updateSelect = jest.fn();
  const eq = jest.fn();
  const updateEq = jest.fn();
  const limit = jest.fn();
  const single = jest.fn();
  const update = jest.fn();
  const insert = jest.fn();
  const from = jest.fn();
  const client = { from };

  const tenantRow = {
    id: 'tenant-1',
    name: 'Acme',
    slug: 'acme',
    status: TenantStatus.Active,
    created_at: '2026-05-24T12:00:00.000Z',
    updated_at: '2026-05-25T12:00:00.000Z',
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-25T12:00:00.000Z'));
    from.mockImplementation((table: string) => {
      if (table === 'audit_logs') {
        return { insert };
      }
      return { select, update };
    });
    select.mockReturnValue({ eq, limit });
    eq.mockReturnValue({ single });
    update.mockReturnValue({ eq: updateEq });
    updateEq.mockReturnValue({ select: updateSelect });
    updateSelect.mockReturnValue({ single });
    limit.mockResolvedValue({ data: [], error: null });
    single.mockResolvedValue({ data: tenantRow, error: null });
    insert.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('requires Supabase service credentials when no client is injected', () => {
    expect(() => new PostgresClient()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for database access',
    );
  });

  it('creates a default Supabase client from environment variables', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    expect(() => new PostgresClient()).not.toThrow();
  });

  it('checks database API health', async () => {
    const database = new PostgresClient({ client });

    await expect(database.health()).resolves.toEqual({
      status: 'ok',
      now: '2026-05-25T12:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('tenants');
    expect(select).toHaveBeenCalledWith('id');
    expect(limit).toHaveBeenCalledWith(1);
  });

  it('throws when the health query fails', async () => {
    const error = new Error('database unavailable');
    limit.mockResolvedValue({ data: null, error });
    const database = new PostgresClient({ client });

    await expect(database.health()).rejects.toThrow(error);
  });

  it('finds a tenant by id', async () => {
    const database = new PostgresClient({ client });

    await expect(database.findTenantById('tenant-1')).resolves.toEqual(
      tenantRow,
    );
    expect(from).toHaveBeenCalledWith('tenants');
    expect(select).toHaveBeenCalledWith(
      'id, name, slug, status, created_at, updated_at',
    );
    expect(eq).toHaveBeenCalledWith('id', 'tenant-1');
    expect(single).toHaveBeenCalledTimes(1);
  });

  it('returns null when a tenant is not found', async () => {
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const database = new PostgresClient({ client });

    await expect(database.findTenantById('missing')).resolves.toBeNull();
  });

  it('rethrows non-no-rows errors when finding a tenant', async () => {
    const error = { code: 'PGRST500', message: 'boom' };
    single.mockResolvedValue({ data: null, error });
    const database = new PostgresClient({ client });

    await expect(database.findTenantById('tenant-1')).rejects.toBe(error);
  });

  it('updates a tenant and returns the updated row', async () => {
    const database = new PostgresClient({ client });

    await expect(
      database.updateTenant('tenant-1', { name: 'New Name' }),
    ).resolves.toEqual(tenantRow);
    expect(update).toHaveBeenCalledWith({
      name: 'New Name',
      updated_at: '2026-05-25T12:00:00.000Z',
    });
    expect(updateEq).toHaveBeenCalledWith('id', 'tenant-1');
    expect(updateSelect).toHaveBeenCalledWith(
      'id, name, slug, status, created_at, updated_at',
    );
  });

  it('returns null when an update does not match a tenant', async () => {
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const database = new PostgresClient({ client });

    await expect(
      database.updateTenant('missing', { name: 'New Name' }),
    ).resolves.toBeNull();
  });

  it('rethrows non-no-rows errors when updating a tenant', async () => {
    const error = { code: 'PGRST500', message: 'boom' };
    single.mockResolvedValue({ data: null, error });
    const database = new PostgresClient({ client });

    await expect(
      database.updateTenant('tenant-1', { name: 'New Name' }),
    ).rejects.toBe(error);
  });

  it('inserts audit log rows', async () => {
    const database = new PostgresClient({ client });
    const metadata = { name: 'New Name' };

    await database.insertAuditLog('tenant-1', 'tenant.updated', metadata);

    expect(from).toHaveBeenCalledWith('audit_logs');
    expect(insert).toHaveBeenCalledWith({
      tenant_id: 'tenant-1',
      action: 'tenant.updated',
      metadata,
    });
  });

  it('throws when an audit log insert fails', async () => {
    const error = new Error('insert failed');
    insert.mockResolvedValue({ data: null, error });
    const database = new PostgresClient({ client });

    await expect(
      database.insertAuditLog('tenant-1', 'tenant.updated', {}),
    ).rejects.toThrow(error);
  });
});
