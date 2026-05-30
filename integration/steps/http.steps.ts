// Generic HTTP request/response steps, reused across every feature.
import { When, Then, DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import request from 'supertest';
import type { IntegrationWorld } from '../support/world';

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
