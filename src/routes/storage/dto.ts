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

export class StorageUploadObjectDto {
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

export class StorageDeleteObjectsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paths!: string[];
}

export class StorageCreateSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  expiresIn?: number;
}
