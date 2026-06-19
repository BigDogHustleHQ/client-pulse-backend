import { z } from 'zod';
import { generate } from './generate';

const originalJSONParse = JSON.parse;

const outputSchema = z.object({
  summary: z.string(),
  confidence: z.number(),
});

const okResponse = (model: string, content: unknown): Response =>
  new Response(
    JSON.stringify({
      id: 'chatcmpl_test',
      model,
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 8,
        total_tokens: 20,
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

const requestBodyAt = (
  fetchMock: jest.Mock<Promise<Response>, Parameters<typeof fetch>>,
  callIndex: number,
): Record<string, unknown> => {
  const init = fetchMock.mock.calls[callIndex]?.[1];
  if (!init?.body || typeof init.body !== 'string') {
    throw new Error(`missing JSON request body for fetch call ${callIndex}`);
  }
  return JSON.parse(init.body) as Record<string, unknown>;
};

describe('generate', () => {
  const originalFetch = global.fetch;
  const originalLiteLlmBaseUrl = process.env.LITELLM_BASE_URL;
  const originalLiteLlmApiKey = process.env.LITELLM_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.LITELLM_BASE_URL = originalLiteLlmBaseUrl;
    process.env.LITELLM_API_KEY = originalLiteLlmApiKey;
    jest.restoreAllMocks();
  });

  it('routes through LiteLLM with a tenant virtual key and validates output', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        okResponse('anthropic/claude-sonnet-4-6', {
          summary: 'ready',
          confidence: 0.91,
        }),
    );

    const result = await generate(
      {
        tenant: 'tenant_123',
        feature: 'vendor-risk-summary',
        prompt_version: 'v1',
        input: { vendor: 'Acme' },
        output_schema: outputSchema,
      },
      {
        fetch: fetchMock,
        baseUrl: 'https://litellm.example.test',
        apiKey: 'vk-{tenant}',
      },
    );

    expect(result.output).toEqual({ summary: 'ready', confidence: 0.91 });
    expect(result.metadata).toMatchObject({
      tenant: 'tenant_123',
      feature: 'vendor-risk-summary',
      prompt_version: 'v1',
      model: 'anthropic/claude-sonnet-4-6',
      model_tier: 'sonnet',
      provider: 'litellm',
      downgraded: false,
      cache_control: 'ephemeral',
      request_id: 'chatcmpl_test',
      usage: {
        input_tokens: 12,
        output_tokens: 8,
        total_tokens: 20,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://litellm.example.test/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer vk-tenant_123',
          'x-clientpulse-tenant': 'tenant_123',
        }),
      }),
    );
    expect(requestBodyAt(fetchMock, 0)).toMatchObject({
      model: 'anthropic/claude-sonnet-4-6',
      response_format: { type: 'json_object' },
      metadata: {
        tenant: 'tenant_123',
        feature: 'vendor-risk-summary',
        prompt_version: 'v1',
      },
    });
  });

  it('downgrades Sonnet to Haiku on rate limit', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(new Response('rate limit', { status: 429 }))
      .mockResolvedValueOnce(
        okResponse('anthropic/claude-haiku-4-5', {
          summary: 'fallback',
          confidence: 0.72,
        }),
      );

    const result = await generate(
      {
        tenant: 'tenant_123',
        feature: 'vendor-risk-summary',
        prompt_version: 'v1',
        input: { vendor: 'Acme' },
        output_schema: outputSchema,
      },
      { fetch: fetchMock },
    );

    expect(result.metadata.model_tier).toBe('haiku');
    expect(result.metadata.downgraded).toBe(true);
    expect(requestBodyAt(fetchMock, 1).model).toBe(
      'anthropic/claude-haiku-4-5',
    );
  });

  it('downgrades Sonnet to Haiku on budget breach text', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(
        new Response('tenant budget exceeded', { status: 403 }),
      )
      .mockResolvedValueOnce(
        okResponse('anthropic/claude-haiku-4-5', {
          summary: 'budget fallback',
          confidence: 0.68,
        }),
      );

    const result = await generate(
      {
        tenant: 'tenant_123',
        feature: 'vendor-risk-summary',
        prompt_version: 'v1',
        input: { vendor: 'Acme' },
        output_schema: outputSchema,
      },
      { fetch: fetchMock },
    );

    expect(result.metadata.downgraded).toBe(true);
    expect(result.output.summary).toBe('budget fallback');
  });

  it('uses env configuration and fallback metadata when optional response fields are absent', async () => {
    process.env.LITELLM_BASE_URL = 'https://env-litellm.example.test';
    process.env.LITELLM_API_KEY = 'env-{tenant}';
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: 'env defaults',
                    confidence: 0.83,
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    global.fetch = fetchMock;

    const result = await generate({
      tenant: 'tenant_123',
      feature: 'vendor-risk-summary',
      prompt_version: 'v1',
      input: { vendor: 'Acme' },
      system: 'Return a compact JSON risk summary.',
      output_schema: outputSchema,
    });

    expect(result.metadata).toMatchObject({
      model: 'anthropic/claude-sonnet-4-6',
      model_tier: 'sonnet',
      usage: undefined,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://env-litellm.example.test/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer env-tenant_123',
        }),
      }),
    );
    const messages = requestBodyAt(fetchMock, 0).messages as Array<{
      content: Array<{ text: string }>;
    }>;
    expect(messages[0].content[0].text).toBe(
      'Return a compact JSON risk summary.',
    );
  });

  it('uses a built-in tenant virtual key when no key is configured', async () => {
    delete process.env.LITELLM_API_KEY;
    delete process.env.LITELLM_BASE_URL;
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        okResponse('anthropic/claude-sonnet-4-6', {
          summary: 'default key',
          confidence: 0.8,
        }),
    );

    await generate(
      {
        tenant: 'tenant_123',
        feature: 'vendor-risk-summary',
        prompt_version: 'v1',
        input: { vendor: 'Acme' },
        output_schema: outputSchema,
      },
      { fetch: fetchMock },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer cp-tenant-tenant_123',
        }),
      }),
    );
  });

  it('does not downgrade on unrelated client errors', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(new Response('bad prompt', { status: 400 }));

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow('LiteLLM request failed with HTTP 400');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the final LiteLLM response is not ok', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(new Response('internal error', { status: 500 }));

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow('LiteLLM request failed with HTTP 500');
  });

  it('escalates to Opus for high complexity without downgrading first', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        okResponse('anthropic/claude-opus-4-7', {
          summary: 'deep analysis',
          confidence: 0.97,
        }),
    );

    const result = await generate(
      {
        tenant: 'tenant_123',
        feature: 'contract-review',
        prompt_version: 'v2',
        input: { contract: '...' },
        complexity: 'high',
        output_schema: outputSchema,
      },
      { fetch: fetchMock },
    );

    expect(result.metadata.model_tier).toBe('opus');
    expect(result.metadata.downgraded).toBe(false);
    expect(requestBodyAt(fetchMock, 0).model).toBe('anthropic/claude-opus-4-7');
  });

  it('rejects responses that do not match the caller schema', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () => okResponse('anthropic/claude-sonnet-4-6', { summary: 123 }),
    );

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow();
  });

  it('throws when LiteLLM returns invalid JSON content', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        new Response(
          JSON.stringify({
            model: 'anthropic/claude-sonnet-4-6',
            choices: [{ message: { content: 'not-json' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow('LiteLLM returned non-JSON content');
  });

  it('reports non-Error JSON parse failures', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        new Response(
          JSON.stringify({
            model: 'anthropic/claude-sonnet-4-6',
            choices: [{ message: { content: 'not-json' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    jest.spyOn(JSON, 'parse').mockImplementation((text: string) => {
      if (text === 'not-json') {
        throw 'parser failed';
      }
      return originalJSONParse(text) as unknown;
    });

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow('LiteLLM returned non-JSON content: parser failed');
  });

  it('throws when LiteLLM omits message content', async () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () =>
        new Response(
          JSON.stringify({
            model: 'anthropic/claude-sonnet-4-6',
            choices: [{ message: {} }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );

    await expect(
      generate(
        {
          tenant: 'tenant_123',
          feature: 'vendor-risk-summary',
          prompt_version: 'v1',
          input: { vendor: 'Acme' },
          output_schema: outputSchema,
        },
        { fetch: fetchMock },
      ),
    ).rejects.toThrow('LiteLLM response did not include message content');
  });
});
