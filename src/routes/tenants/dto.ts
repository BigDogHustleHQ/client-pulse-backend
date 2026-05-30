import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantStatus } from '../../types/enums/tenant';
import { HasAtLeastOneField } from '../../lib/validation/has-at-least-one-field';

@HasAtLeastOneField(['name', 'slug', 'status'])
export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
