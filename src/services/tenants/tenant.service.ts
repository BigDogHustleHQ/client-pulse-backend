import { Injectable } from '@nestjs/common';
import { PostgresClient } from '../postgres/postgres';
import type { TenantStatus } from '../../types/enums/tenant';
import type { Tenant, UpdateTenantInput } from './types';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TenantService {
  constructor(private readonly postgres: PostgresClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const result = await this.postgres.query<TenantRow>(
      'select id, name, slug, status, created_at, updated_at from tenants where id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async update(id: string, patch: UpdateTenantInput): Promise<Tenant | null> {
    const columns: string[] = [];
    const values: unknown[] = [];

    if (patch.name !== undefined) {
      columns.push(`name = $${values.length + 1}`);
      values.push(patch.name);
    }
    if (patch.slug !== undefined) {
      columns.push(`slug = $${values.length + 1}`);
      values.push(patch.slug);
    }
    if (patch.status !== undefined) {
      columns.push(`status = $${values.length + 1}`);
      values.push(patch.status);
    }
    columns.push('updated_at = now()');

    values.push(id);
    const result = await this.postgres.query<TenantRow>(
      `update tenants set ${columns.join(', ')} where id = $${values.length} returning id, name, slug, status, created_at, updated_at`,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    await this.postgres.query(
      'insert into audit_logs (tenant_id, action, metadata) values ($1, $2, $3)',
      [id, 'tenant.updated', JSON.stringify(patch)],
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: TenantRow): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
