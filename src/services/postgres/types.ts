import type { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

export type PostgresPool = Pick<Pool, 'connect' | 'end' | 'query'>;

export interface PostgresClientOptions {
  connectionString?: string;
  pool?: PostgresPool;
  poolConfig?: PoolConfig;
}

export interface DatabaseHealth {
  status: 'ok';
  now: string;
}

export type DatabaseQueryResult<T extends QueryResultRow = QueryResultRow> =
  QueryResult<T>;
