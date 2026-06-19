import { Test } from '@nestjs/testing';
import { AiController } from './ai.module';

jest.mock('../../packages/ai', () => ({
  generate: jest.fn(async () => ({
    output: { summary: 'ok' },
    metadata: {
      model: 'anthropic/claude-sonnet-4-6',
      modelTier: 'sonnet',
      provider: 'litellm',
    },
  })),
}));

describe('AiController', () => {
  it('delegates POST bodies to the shared generate wrapper', async () => {
    const { generate } = await import('../../packages/ai');
    const moduleRef = await Test.createTestingModule({
      controllers: [AiController],
    }).compile();
    const controller = moduleRef.get(AiController);

    await expect(
      controller.generate({
        tenant: 'tenant_123',
        feature: 'known-prompt',
        promptVersion: 'v1',
        input: { topic: 'test' },
        complexity: 'medium',
      }),
    ).resolves.toMatchObject({
      output: { summary: 'ok' },
      metadata: { modelTier: 'sonnet' },
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: 'tenant_123',
        feature: 'known-prompt',
        promptVersion: 'v1',
        input: { topic: 'test' },
        complexity: 'medium',
      }),
    );
  });
});
