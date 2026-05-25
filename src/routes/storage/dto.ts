import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UploadObjectDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsBoolean()
  upsert?: boolean;
}

export class DeleteObjectsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paths!: string[];
}

export class CreateSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  expiresIn?: number;
}
