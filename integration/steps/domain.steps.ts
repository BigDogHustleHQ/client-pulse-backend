// Domain steps: seed the in-memory fakes and assert domain side effects.
import { Given, Then, DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import type { IntegrationWorld } from '../support/world';
import { TenantStatus } from '../support/fakes';

Given('a tenant exists with:', function (this: IntegrationWorld, t: DataTable) {
  const r = t.rowsHash();
  this.fakes.seedTenant({
    id: r.id,
    name: r.name,
    slug: r.slug,
    status: r.status as TenantStatus,
  });
});

Given(
  'the {string} bucket contains {string}',
  function (this: IntegrationWorld, bucket: string, path: string) {
    this.fakes.storageWriter.upload({ bucket, path });
  },
);

Given('the database is unavailable', function (this: IntegrationWorld) {
  this.fakes.dbHealthy = false;
});

Then(
  'an audit log entry should be recorded for {string}',
  function (this: IntegrationWorld, action: string) {
    assert.ok(this.fakes.auditLog.includes(action));
  },
);

Then(
  'the {string} bucket should not contain {string}',
  function (this: IntegrationWorld, bucket: string, path: string) {
    assert.ok(!this.fakes.objects.get(bucket)?.has(path));
  },
);
