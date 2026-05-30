// In-memory stand-ins for the provider boundary. The integration suite boots
// the real HTTP app (routing, controllers, validation) and only these
// service-level providers are faked, so no Redis/Postgres/storage is needed.
import type { Tenant } from '../../src/services/tenants/types';
import { TenantStatus } from '../../src/types/enums/tenant';

const TS = '2026-05-24T12:00:00.000Z';

export class Fakes {
  tenants = new Map<string, Tenant>();
  auditLog: string[] = [];
  objects = new Map<string, Set<string>>();
  dbHealthy = true;

  seedTenant(t: Pick<Tenant, 'id' | 'name' | 'slug' | 'status'>): void {
    this.tenants.set(t.id, { ...t, createdAt: TS, updatedAt: TS });
  }

  private bucket(name: string): Set<string> {
    let set = this.objects.get(name);
    if (!set) this.objects.set(name, (set = new Set()));
    return set;
  }

  // TenantService stand-in (routes/tenants).
  tenantService = {
    findById: (id: string) => Promise.resolve(this.tenants.get(id) ?? null),
    update: (id: string, patch: Partial<Tenant>) => {
      const existing = this.tenants.get(id);
      if (!existing) return Promise.resolve(null);
      const updated = { ...existing, ...patch };
      this.tenants.set(id, updated);
      this.auditLog.push('tenant.updated');
      return Promise.resolve(updated);
    },
  };

  // StorageWriter stand-in (routes/storage).
  storageWriter = {
    upload: ({ bucket, path }: { bucket: string; path: string }) => {
      this.bucket(bucket).add(path);
      return Promise.resolve({ bucket, name: path, id: 'id', updatedAt: null });
    },
    remove: (bucket: string, paths: string[]) => {
      paths.forEach((p) => this.bucket(bucket).delete(p));
      return Promise.resolve(paths);
    },
    list: (bucket: string, prefix?: string) =>
      Promise.resolve(
        [...this.bucket(bucket)].filter((p) => !prefix || p.startsWith(prefix)),
      ),
    createSignedUrl: (bucket: string, path: string, expiresIn: number) =>
      Promise.resolve({
        signedUrl: `https://signed.example/${bucket}/${path}?expires=${expiresIn}`,
      }),
  };

  // Dependency health probes (routes/dependencies).
  postgresHealth = {
    health: () =>
      this.dbHealthy
        ? Promise.resolve({ status: 'ok' as const, now: TS })
        : Promise.reject(new Error('database unavailable')),
  };
  blobStorageHealth = {
    health: () =>
      Promise.resolve({
        status: 'ok' as const,
        buckets: ['media-uploads', 'generated-sites'],
      }),
  };
}

export { TenantStatus };
