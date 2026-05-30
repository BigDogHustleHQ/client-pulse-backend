/**
 * Domain-specific Given steps that seed the in-memory fakes, plus a few
 * assertions that reach into fake state to confirm side effects (audit log,
 * stored objects) actually happened end to end.
 */
import { Given, Then, DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import type { IntegrationWorld } from '../support/world';
import { TenantStatus } from '../../src/types/enums/tenant';

const toStatus = (value: string): TenantStatus => {
  const status = Object.values(TenantStatus).find((s) => s === value);
  if (!status) {
    throw new Error(`Unknown tenant status in step: ${value}`);
  }
  return status;
};

// --- Tenants --------------------------------------------------------------

Given(
  'a tenant exists with:',
  function (this: IntegrationWorld, table: DataTable) {
    const row = table.rowsHash();
    this.fakes.postgres.seedTenant({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: toStatus(row.status),
    });
  },
);

Then(
  /^an audit log entry should be recorded for action "([^"]+)"$/,
  function (this: IntegrationWorld, action: string) {
    const match = this.fakes.postgres.auditLogs.find(
      (entry) => (entry as { action?: string }).action === action,
    );
    assert.ok(match, `no audit log entry found for action "${action}"`);
  },
);

// --- Storage --------------------------------------------------------------

Given(
  /^the "([^"]+)" bucket contains an object "([^"]+)"$/,
  function (this: IntegrationWorld, bucket: string, path: string) {
    this.fakes.storage.seedObject(bucket, path);
  },
);

Then(
  /^the "([^"]+)" bucket should contain an object "([^"]+)"$/,
  function (this: IntegrationWorld, bucket: string, path: string) {
    const objects = this.fakes.storage.buckets.get(bucket);
    assert.ok(objects?.has(path), `object "${path}" not found in ${bucket}`);
  },
);

Then(
  /^the "([^"]+)" bucket should not contain an object "([^"]+)"$/,
  function (this: IntegrationWorld, bucket: string, path: string) {
    const objects = this.fakes.storage.buckets.get(bucket);
    assert.ok(
      !objects?.has(path),
      `object "${path}" should have been removed from ${bucket}`,
    );
  },
);

// --- Dependencies ---------------------------------------------------------

Given('the database is unavailable', function (this: IntegrationWorld) {
  this.fakes.postgres.healthy = false;
});
