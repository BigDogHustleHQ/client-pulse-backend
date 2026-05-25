import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { PostgresClient } from '../../services/postgres/postgres';
import { TenantService } from '../../services/tenants/tenant.service';
import { TenantStatus } from '../../types/enums/tenant';
import type { Tenant, UpdateTenantInput } from '../../services/tenants/types';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantService) {}

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      throw new NotFoundException();
    }
    return tenant;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTenantInput,
  ): Promise<Tenant> {
    if (
      body.name === undefined &&
      body.slug === undefined &&
      body.status === undefined
    ) {
      throw new BadRequestException('no updatable fields');
    }
    if (
      body.status !== undefined &&
      !Object.values(TenantStatus).includes(body.status)
    ) {
      throw new BadRequestException('invalid status');
    }

    const tenant = await this.tenants.update(id, body);
    if (!tenant) {
      throw new NotFoundException();
    }
    return tenant;
  }
}

@Module({
  controllers: [TenantsController],
  providers: [
    TenantService,
    {
      provide: PostgresClient,
      useFactory: /* istanbul ignore next */ (): PostgresClient =>
        new PostgresClient(),
    },
  ],
})
export class TenantsModule {}
