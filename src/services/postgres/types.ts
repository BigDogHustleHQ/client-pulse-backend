import type { TenantStatus } from '../../types/enums/tenant';

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: unknown | null;
}

export interface SupabaseTableQuery<TSelect, TUpdate = Partial<TSelect>> {
  select(columns: string): SupabaseTableQuery<TSelect, TUpdate>;
  eq(column: string, value: unknown): SupabaseTableQuery<TSelect, TUpdate>;
  limit(count: number): Promise<SupabaseQueryResult<TSelect[]>>;
  single(): Promise<SupabaseQueryResult<TSelect>>;
  update(values: TUpdate): {
    eq(
      column: string,
      value: unknown,
    ): {
      select(columns: string): {
        single(): Promise<SupabaseQueryResult<TSelect>>;
      };
    };
  };
  insert(values: unknown): Promise<SupabaseQueryResult<unknown>>;
}

export interface SupabaseDatabaseAdapter {
  from(table: 'tenants'): SupabaseTableQuery<TenantRow>;
  from(table: 'audit_logs'): Pick<SupabaseTableQuery<unknown>, 'insert'>;
}

export interface PostgresClientOptions {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  client?: SupabaseDatabaseAdapter;
}

export interface DatabaseHealth {
  status: 'ok';
  now: string;
}
