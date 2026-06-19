import { z } from 'zod';
import { generate } from './generate';

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
});
