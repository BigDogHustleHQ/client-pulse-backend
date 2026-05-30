// All step definitions for the integration suite.
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import request from 'supertest';
import type { IntegrationWorld } from '../support/world';
import { TenantStatus } from '../support/fakes';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const send = async (
  w: IntegrationWorld,
  method: string,
  path: string,
  body?: unknown,
): Promise<void> => {
  let req = request(w.server)[method.toLowerCase() as Method](path);
  if (body !== undefined) req = req.send(body as object);
  w.response = await req;
};

// --- Given: seed fakes ----------------------------------------------------

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

// --- When: requests -------------------------------------------------------

When(
  'I {word} {string}',
  async function (this: IntegrationWorld, method: string, path: string) {
    await send(this, method, path);
  },
);

When(
  'I {word} {string} with body:',
  async function (
    this: IntegrationWorld,
    method: string,
    path: string,
    body: string,
  ) {
    await send(this, method, path, JSON.parse(body));
  },
);

// --- Then: assertions -----------------------------------------------------

Then(
  'the response status should be {int}',
  function (this: IntegrationWorld, status: number) {
    assert.equal(this.response?.status, status);
  },
);

Then(
  'the response body should equal:',
  function (this: IntegrationWorld, body: string) {
    assert.deepEqual(this.response?.body, JSON.parse(body));
  },
);

Then(
  'the response body should have fields:',
  function (this: IntegrationWorld, table: DataTable) {
    const body = this.response?.body as Record<string, unknown>;
    for (const { field, value } of table.hashes()) {
      assert.equal(String(body[field]), value);
    }
  },
);

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
