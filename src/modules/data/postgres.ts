import { Pool, type QueryResultRow } from 'pg';
import type {
  DatabaseHealth,
  DatabaseQueryResult,
  PostgresClientOptions,
  PostgresPool,
} from './types';

export class PostgresClient {
  private readonly pool: PostgresPool;

  constructor(options: PostgresClientOptions = {}) {
    if (options.pool) {
      this.pool = options.pool;
      return;
    }

    /* istanbul ignore next */
    const connectionString =
      options.connectionString ?? process.env.DATABASE_URL;
    /* istanbul ignore next */
    this.pool = new Pool({
      connectionString,
      ssl: connectionString ? { rejectUnauthorized: false } : undefined,
      ...options.poolConfig,
    });
  }

  async health(): Promise<DatabaseHealth> {
    const result = await this.query<{ now: Date }>('select now() as now');
    return {
      status: 'ok',
      now: result.rows[0]?.now.toISOString() ?? new Date(0).toISOString(),
    };
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<DatabaseQueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
