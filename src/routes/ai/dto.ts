import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { AiComplexity } from '../../packages/ai';

export class AiGenerateDto {
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
