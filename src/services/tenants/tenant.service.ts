import { Injectable } from '@nestjs/common';
import { PostgresClient } from '../postgres/postgres';
import type { Tenant, UpdateTenantInput } from './tenant.types';
import type { TenantRow } from '../postgres/postgres.types';

@Injectable()
export class TenantService {
  constructor(private readonly postgres: PostgresClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.postgres.findTenantById(id);
    return row ? this.mapRow(row) : null;
  }

  async update(id: string, patch: UpdateTenantInput): Promise<Tenant | null> {
    const row = await this.postgres.updateTenant(id, patch);
    if (!row) {
      return null;
    }

    await this.postgres.insertAuditLog(id, 'tenant.updated', patch);

    return this.mapRow(row);
  }

  private mapRow(row: TenantRow): Tenant {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
