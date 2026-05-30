-- 0001_tenants_and_audit_logs.sql
-- Derived from client-pulse-docs: Supabase PostgreSQL holds "tenant data, audit logs".
-- Row-Level Security policies are intentionally NOT added here — they land with
-- SID-61 (tenant scoping via Clerk), per docs/SPEC.md.

create extension if not exists "pgcrypto";

create table if not exists tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  status     text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  action     text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_id_idx on audit_logs (tenant_id);
