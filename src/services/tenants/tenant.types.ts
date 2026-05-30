import type { TenantStatus } from '../../types/enums/tenant';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  status?: TenantStatus;
}
