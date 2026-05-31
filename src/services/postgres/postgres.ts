import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type {
  DatabaseHealth,
  PostgresClientOptions,
  SupabaseDatabaseAdapter,
  TenantRow,
} from './postgres.types';

@Injectable()
export class PostgresClient {
  private readonly client: SupabaseDatabaseAdapter;

  constructor(options: PostgresClientOptions = {}) {
    if (options.client) {
      this.client = options.client;
      return;
    }

    /* istanbul ignore next */
    const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL;
    const serviceRoleKey =
      options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for database access',
      );
    }

    this.client = createClient(
      supabaseUrl,
      serviceRoleKey,
    ) as unknown as SupabaseDatabaseAdapter;
  }

  async health(): Promise<DatabaseHealth> {
    const { error } = await this.client.from('tenants').select('id').limit(1);

    if (error) {
      throw error;
    }

    return {
      status: 'ok',
      now: new Date().toISOString(),
    };
  }

  async findTenantById(id: string): Promise<TenantRow | null> {
    const { data, error } = await this.client
      .from('tenants')
      .select('id, name, slug, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (this.isNoRowsError(error)) {
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateTenant(
    id: string,
    patch: Partial<Pick<TenantRow, 'name' | 'slug' | 'status'>>,
  ): Promise<TenantRow | null> {
    const { data, error } = await this.client
      .from('tenants')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, slug, status, created_at, updated_at')
      .single();

    if (error) {
      if (this.isNoRowsError(error)) {
        return null;
      }
      throw error;
    }

    return data;
  }

  async insertAuditLog(
    tenantId: string,
    action: string,
    metadata: unknown,
  ): Promise<void> {
    const { error } = await this.client.from('audit_logs').insert({
      tenant_id: tenantId,
      action,
      metadata,
    });

    if (error) {
      throw error;
    }
  }

  private isNoRowsError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PGRST116'
    );
  }
}
