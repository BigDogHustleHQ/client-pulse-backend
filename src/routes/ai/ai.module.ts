import { Body, Controller, Module, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { AuthModule } from '../../lib/auth/auth.module';
import { ClerkAuthGuard } from '../../lib/auth/clerk-auth.guard';
import { generate } from '../../packages/ai';
import { AiGenerateDto } from './dto';

const routeOutputSchema = z.record(z.string(), z.unknown());

@UseGuards(ClerkAuthGuard)
@Controller('ai')
export class AiController {
  // Exercise the shared wrapper from HTTP/Bruno. Product features should import
  // packages/ai and pass their own concrete zod schema for typed outputs.
  @Post('generate')
  async generate(
    @Body() body: AiGenerateDto,
    @Res({ passthrough: true }) response?: Response,
  ): Promise<unknown> {
    const result = await generate({
      tenant: body.tenant,
      feature: body.feature,
      promptVersion: body.promptVersion,
      input: body.input,
      complexity: body.complexity,
      outputSchema: routeOutputSchema,
    });

    response?.setHeader('x-ai-route', result.metadata.provider);
    response?.setHeader('x-ai-model', result.metadata.model);
    return result;
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AiController],
})
export class AiModule {}
