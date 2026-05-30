/**
 * Generic HTTP request/response steps reused across every feature.
 */
import { When, Then, DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import request from 'supertest';
import type { IntegrationWorld } from '../support/world';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const send = async (
  world: IntegrationWorld,
  method: Method,
  path: string,
  body?: unknown,
): Promise<void> => {
  let req = request(world.server)[method](path);
  if (body !== undefined) {
    req = req.send(body as object);
  }
  world.response = await req;
};

// --- Requests without a body ----------------------------------------------

When(
  /^I send a (GET|DELETE) request to "([^"]+)"$/,
  async function (this: IntegrationWorld, method: string, path: string) {
    await send(this, method.toLowerCase() as Method, path);
  },
);

// --- Requests with a JSON body --------------------------------------------

When(
  /^I send a (POST|PUT|PATCH|DELETE) request to "([^"]+)" with body:$/,
  async function (
    this: IntegrationWorld,
    method: string,
    path: string,
    docString: string,
  ) {
    await send(
      this,
      method.toLowerCase() as Method,
      path,
      JSON.parse(docString),
    );
  },
);

When(
  /^I send a (POST|PUT|PATCH) request to "([^"]+)" with an empty body$/,
  async function (this: IntegrationWorld, method: string, path: string) {
    await send(this, method.toLowerCase() as Method, path, {});
  },
);

// --- Assertions -----------------------------------------------------------

Then(
  /^the response status should be (\d+)$/,
  function (this: IntegrationWorld, status: string) {
    assert.ok(this.response, 'no response captured');
    assert.equal(this.response.status, Number(status));
  },
);

Then(
  'the response body should equal:',
  function (this: IntegrationWorld, docString: string) {
    assert.ok(this.response, 'no response captured');
    assert.deepEqual(this.response.body, JSON.parse(docString));
  },
);

Then(
  /^the response body field "([^"]+)" should equal "([^"]*)"$/,
  function (this: IntegrationWorld, field: string, expected: string) {
    assert.ok(this.response, 'no response captured');
    const actual = field
      .split('.')
      .reduce<unknown>(
        (value, key) => (value as Record<string, unknown>)?.[key],
        this.response.body,
      );
    assert.equal(String(actual), expected);
  },
);

Then(
  'the response body should have fields:',
  function (this: IntegrationWorld, table: DataTable) {
    assert.ok(this.response, 'no response captured');
    const body = this.response.body as Record<string, unknown>;
    for (const { field, value } of table.hashes()) {
      assert.equal(String(body[field]), value);
    }
  },
);
