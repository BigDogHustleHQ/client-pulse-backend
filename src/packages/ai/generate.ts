import { z } from 'zod';

export type AiComplexity = 'low' | 'medium' | 'high';
export type AiModelTier = 'haiku' | 'sonnet' | 'opus';

export interface AiGenerateInput<TSchema extends z.ZodType> {
  tenant: string;
  feature: string;
  promptVersion: string;
  input: unknown;
  outputSchema: TSchema;
  complexity?: AiComplexity;
  system?: string;
}

export interface AiGenerateMetadata {
  tenant: string;
  feature: string;
  promptVersion: string;
  model: string;
  modelTier: AiModelTier;
  provider: 'litellm';
  downgraded: boolean;
  cacheControl: 'ephemeral';
  requestId?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface AiGenerateResult<TOutput> {
  output: TOutput;
  metadata: AiGenerateMetadata;
}

interface LiteLlmMessage {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<{
        type: 'text';
        text: string;
        cache_control?: { type: 'ephemeral' };
      }>;
}

interface LiteLlmRequestBody {
  model: string;
  messages: LiteLlmMessage[];
  response_format: { type: 'json_object' };
  metadata: {
    tenant: string;
    feature: string;
    promptVersion: string;
  };
}

interface LiteLlmResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface GenerateOptions {
  fetch?: typeof fetch;
  baseUrl?: string;
  apiKey?: string;
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-6';
const FALLBACK_MODEL = 'anthropic/claude-haiku-4-5';
const ESCALATION_MODEL = 'anthropic/claude-opus-4-7';

const modelTierFor = (model: string): AiModelTier => {
  if (model.includes('haiku')) {
    return 'haiku';
  }
  if (model.includes('opus')) {
    return 'opus';
  }
  return 'sonnet';
};

const buildVirtualKey = (tenant: string, apiKey?: string): string => {
  const configured = apiKey ?? process.env.LITELLM_API_KEY;
  if (configured) {
    return configured.replace('{tenant}', tenant);
  }
  return `cp-tenant-${tenant}`;
};

const isRetryableBudgetOrRateLimit = async (
  response: Response,
): Promise<boolean> => {
  if (response.status === 429 || response.status === 402) {
    return true;
  }

  if (response.status !== 400 && response.status !== 403) {
    return false;
  }

  const text = await response.clone().text();
  return /budget|quota|rate.?limit/i.test(text);
};

const parseJsonOutput = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `LiteLLM returned non-JSON content: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
};

const callLiteLlm = async (
  request: LiteLlmRequestBody,
  tenant: string,
  options: Required<Pick<GenerateOptions, 'fetch' | 'baseUrl'>> &
    Pick<GenerateOptions, 'apiKey'>,
): Promise<Response> => {
  return options.fetch(`${options.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${buildVirtualKey(tenant, options.apiKey)}`,
      'content-type': 'application/json',
      'x-clientpulse-tenant': tenant,
    },
    body: JSON.stringify(request),
  });
};

const buildRequestBody = <TSchema extends z.ZodType>(
  params: AiGenerateInput<TSchema>,
  model: string,
): LiteLlmRequestBody => ({
  model,
  messages: [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text:
            params.system ??
            'Return only JSON matching the requested output schema.',
          cache_control: { type: 'ephemeral' },
        },
      ],
    },
    {
      role: 'user',
      content: JSON.stringify({
        tenant: params.tenant,
        feature: params.feature,
        promptVersion: params.promptVersion,
        input: params.input,
      }),
    },
  ],
  response_format: { type: 'json_object' },
  metadata: {
    tenant: params.tenant,
    feature: params.feature,
    promptVersion: params.promptVersion,
  },
});

/**
 * Generate typed AI output through LiteLLM.
 *
 * Callers provide tenant, feature, prompt version, raw input, and a zod output
 * schema. The wrapper enforces model policy, prompt caching, tenant-scoped
 * virtual keys, response validation, and metadata stamping for cost/audit code.
 */
export async function generate<TSchema extends z.ZodType>(
  params: AiGenerateInput<TSchema>,
  options: GenerateOptions = {},
): Promise<AiGenerateResult<z.infer<TSchema>>> {
  const fetcher = options.fetch ?? fetch;
  const baseUrl =
    options.baseUrl ?? process.env.LITELLM_BASE_URL ?? 'http://localhost:4000';
  const firstModel =
    params.complexity === 'high' ? ESCALATION_MODEL : DEFAULT_MODEL;

  const firstResponse = await callLiteLlm(
    buildRequestBody(params, firstModel),
    params.tenant,
    { fetch: fetcher, baseUrl, apiKey: options.apiKey },
  );

  let response = firstResponse;
  let model = firstModel;
  let downgraded = false;

  if (
    firstModel === DEFAULT_MODEL &&
    (await isRetryableBudgetOrRateLimit(firstResponse))
  ) {
    model = FALLBACK_MODEL;
    downgraded = true;
    response = await callLiteLlm(
      buildRequestBody(params, FALLBACK_MODEL),
      params.tenant,
      { fetch: fetcher, baseUrl, apiKey: options.apiKey },
    );
  }

  if (!response.ok) {
    throw new Error(`LiteLLM request failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as LiteLlmResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LiteLLM response did not include message content');
  }

  const output = params.outputSchema.parse(parseJsonOutput(content));
  const usedModel = payload.model ?? model;

  return {
    output,
    metadata: {
      tenant: params.tenant,
      feature: params.feature,
      promptVersion: params.promptVersion,
      model: usedModel,
      modelTier: modelTierFor(usedModel),
      provider: 'litellm',
      downgraded,
      cacheControl: 'ephemeral',
      requestId: payload.id,
      usage: payload.usage
        ? {
            inputTokens: payload.usage.prompt_tokens,
            outputTokens: payload.usage.completion_tokens,
            totalTokens: payload.usage.total_tokens,
          }
        : undefined,
    },
  };
}
