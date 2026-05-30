import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantStatus } from '../../types/enums/tenant';
import { HasAtLeastOneField } from '../../utils/validation/validation.util';

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
