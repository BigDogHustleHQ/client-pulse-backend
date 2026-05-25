# Data Model

The product docs (`client-pulse-docs`) describe persistence only at a high level:
Supabase **PostgreSQL** holds *"tenant data, audit logs"* and Supabase **Storage**
holds *"media uploads, generated sites"*. This file pins that down into the concrete
schema the backend's update services operate on. It is the source of truth for the
PostgreSQL tables until tenant models move into a shared migrations package.

> Row-Level Security is **not** modeled yet — it lands with SID-61 (tenant scoping
> via Clerk JWT). Until then these tables are unscoped; write endpoints are
> service-to-service, not tenant-authenticated.

## PostgreSQL

### `tenants`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `name` | `text` | required |
| `slug` | `text` | required, unique |
| `status` | `text` | `active` \| `suspended` (enum `TenantStatus`) |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()`, bumped on every update |

### `audit_logs`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `tenant_id` | `uuid` | FK → `tenants(id)` on delete cascade |
| `action` | `text` | e.g. `tenant.updated` |
| `metadata` | `jsonb` | arbitrary change payload, defaults `{}` |
| `created_at` | `timestamptz` | `now()` |

Migration: [`db/migrations/0001_tenants_and_audit_logs.sql`](../db/migrations/0001_tenants_and_audit_logs.sql).
Every `tenants` update writes a corresponding `audit_logs` row.

## Supabase Storage

Buckets (enum `StorageBucket`): `media-uploads`, `generated-sites`.

Write operations exposed: **upload/upsert**, **delete**, **list**, **signed URL**.
See the Storage routes and `openapi.yaml`.
