import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { AiComplexity, AiModelTier } from '../../packages/ai';

export class AiGenerateRequestDto {
  @IsString()
  @IsNotEmpty()
  tenant!: string;

  @IsString()
  @IsNotEmpty()
  feature!: string;

  @IsString()
  @IsNotEmpty()
  promptVersion!: string;

  @IsObject()
  input!: Record<string, unknown>;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  complexity?: AiComplexity;
}

export class AiUsageDto {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export class AiGenerateMetadataDto {
  tenant!: string;
  feature!: string;
  promptVersion!: string;
  model!: string;
  modelTier!: AiModelTier;
  provider!: 'litellm';
  downgraded!: boolean;
  cacheControl!: 'ephemeral';
  requestId?: string;
  usage?: AiUsageDto;
}

export class AiGenerateResponseDto {
  output!: Record<string, unknown>;
  metadata!: AiGenerateMetadataDto;
}
