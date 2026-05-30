/**
 * In-memory fakes for the external Supabase boundary.
 *
 * The integration suite drives the *real* PostgresClient / BlobStorageClient
 * (and the controllers + services above them) — only the lowest-level Supabase
 * adapter is swapped for these in-memory doubles, so no real database, storage,
 * or network is required. This mirrors how the clients are wired in production
 * via their `client` option, exercising the real query/mapping logic.
 */
import type {
  SupabaseDatabaseAdapter,
  SupabaseQueryResult,
  TenantRow,
} from '../../src/services/postgres/types';
import type { BlobStorageAdapter } from '../../src/services/blob-storage/types';
import { TenantStatus } from '../../src/types/enums/tenant';

const PGRST_NO_ROWS = { code: 'PGRST116' };

export interface SeedTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at?: string;
  updated_at?: string;
}

/** Stateful in-memory stand-in for the Supabase Postgres adapter. */
export class FakePostgres {
  readonly tenants = new Map<string, TenantRow>();
  readonly auditLogs: unknown[] = [];
  /** When true, the tenants table read used by health() returns an error. */
  healthy = true;

  seedTenant(seed: SeedTenant): void {
    this.tenants.set(seed.id, {
      id: seed.id,
      name: seed.name,
      slug: seed.slug,
      status: seed.status,
      created_at: seed.created_at ?? '2026-05-24T12:00:00.000Z',
      updated_at: seed.updated_at ?? '2026-05-24T12:00:00.000Z',
    });
  }

  /** Cast to the adapter interface; the shape matches the methods the client calls. */
  asAdapter(): SupabaseDatabaseAdapter {
    return {
      from: (table: string) => this.from(table),
    } as SupabaseDatabaseAdapter;
  }

  private from(table: string): unknown {
    if (table === 'audit_logs') {
      return {
        insert: (values: unknown): Promise<SupabaseQueryResult<unknown>> => {
          this.auditLogs.push(values);
          return Promise.resolve({ data: null, error: null });
        },
      };
    }

    const tenants = this.tenants;
    const isHealthy = (): boolean => this.healthy;
    const filters: Record<string, unknown> = {};

    const builder = {
      select() {
        return builder;
      },
      eq(column: string, value: unknown) {
        filters[column] = value;
        return builder;
      },
      limit(count: number): Promise<SupabaseQueryResult<{ id: string }[]>> {
        if (!isHealthy()) {
          return Promise.resolve({
            data: null,
            error: { message: 'database unavailable' },
          });
        }
        const ids = [...tenants.values()]
          .slice(0, count)
          .map((row) => ({ id: row.id }));
        return Promise.resolve({ data: ids, error: null });
      },
      single(): Promise<SupabaseQueryResult<TenantRow>> {
        const row = tenants.get(String(filters.id));
        if (!row) {
          return Promise.resolve({ data: null, error: PGRST_NO_ROWS });
        }
        return Promise.resolve({ data: row, error: null });
      },
      update(values: Partial<TenantRow>) {
        return {
          eq(_column: string, value: unknown) {
            return {
              select() {
                return {
                  single(): Promise<SupabaseQueryResult<TenantRow>> {
                    const existing = tenants.get(String(value));
                    if (!existing) {
                      return Promise.resolve({
                        data: null,
                        error: PGRST_NO_ROWS,
                      });
                    }
                    const updated = { ...existing, ...values };
                    tenants.set(String(value), updated);
                    return Promise.resolve({ data: updated, error: null });
                  },
                };
              },
            };
          },
        };
      },
      insert(): Promise<SupabaseQueryResult<unknown>> {
        return Promise.resolve({ data: null, error: null });
      },
    };

    return builder;
  }
}

/** Stateful in-memory stand-in for the Supabase Storage adapter. */
export class FakeStorage {
  readonly buckets = new Map<string, Map<string, string>>();

  seedObject(bucket: string, path: string): void {
    const objects = this.buckets.get(bucket) ?? new Map<string, string>();
    objects.set(path, 'seeded');
    this.buckets.set(bucket, objects);
  }

  asAdapter(): BlobStorageAdapter {
    const buckets = this.buckets;
    return {
      storage: {
        listBuckets() {
          return Promise.resolve({
            data: [{ name: 'media-uploads' }, { name: 'generated-sites' }],
            error: null,
          });
        },
        from(bucket: string) {
          const objects = buckets.get(bucket) ?? new Map<string, string>();
          buckets.set(bucket, objects);
          return {
            upload(path: string, body: string) {
              objects.set(path, body);
              return Promise.resolve({
                data: { path, id: `obj-${objects.size}` },
                error: null,
              });
            },
            remove(paths: string[]) {
              for (const path of paths) {
                objects.delete(path);
              }
              return Promise.resolve({
                data: paths.map((name) => ({ name })),
                error: null,
              });
            },
            list(prefix?: string) {
              const names = [...objects.keys()]
                .filter((name) => !prefix || name.startsWith(prefix))
                .map((name) => ({ name }));
              return Promise.resolve({ data: names, error: null });
            },
            createSignedUrl(path: string, expiresIn: number) {
              return Promise.resolve({
                data: {
                  signedUrl: `https://signed.example/${bucket}/${path}?expires=${expiresIn}`,
                },
                error: null,
              });
            },
          };
        },
      },
    };
  }
}

export interface Fakes {
  postgres: FakePostgres;
  storage: FakeStorage;
}

export const createFakes = (): Fakes => ({
  postgres: new FakePostgres(),
  storage: new FakeStorage(),
});
