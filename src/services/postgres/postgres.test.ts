import { PostgresClient } from './postgres';

describe('PostgresClient', () => {
  it('creates a default pool from a connection string', async () => {
    const client = new PostgresClient({
      connectionString: 'postgres://user:password@localhost:5432/client_pulse',
    });

    await client.close();
  });

  it('creates a default pool from DATABASE_URL', async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      'postgres://user:password@localhost:5432/client_pulse';

    const client = new PostgresClient();
    await client.close();

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('checks database health', async () => {
    const now = new Date('2026-05-24T12:00:00.000Z');
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [{ now }] }),
      connect: jest.fn(),
      end: jest.fn(),
    };
    const client = new PostgresClient({ pool });

    await expect(client.health()).resolves.toEqual({
      status: 'ok',
      now: now.toISOString(),
    });
    expect(pool.query).toHaveBeenCalledWith('select now() as now', undefined);
  });

  it('falls back when the health query returns no rows', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      connect: jest.fn(),
      end: jest.fn(),
    };
    const client = new PostgresClient({ pool });

    await expect(client.health()).resolves.toEqual({
      status: 'ok',
      now: '1970-01-01T00:00:00.000Z',
    });
  });

  it('passes query values through to the pool', async () => {
    const queryResult = { rows: [{ id: 'tenant-id' }] };
    const pool = {
      query: jest.fn().mockResolvedValue(queryResult),
      connect: jest.fn(),
      end: jest.fn(),
    };
    const client = new PostgresClient({ pool });

    await expect(
      client.query('select * from tenants where id = $1', ['tenant-id']),
    ).resolves.toBe(queryResult);
    expect(pool.query).toHaveBeenCalledWith(
      'select * from tenants where id = $1',
      ['tenant-id'],
    );
  });

  it('closes the pool', async () => {
    const pool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    };
    const client = new PostgresClient({ pool });

    await client.close();

    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});
