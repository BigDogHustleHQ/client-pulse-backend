import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PostgresClient } from '../../services/postgres/postgres';
import { TenantService } from '../../services/tenants/tenant.service';
import type { Tenant } from '../../services/tenants/tenant.types';
import { AuthModule } from '../../lib/auth/auth.module';
import { ClerkAuthGuard } from '../../lib/auth/clerk-auth.guard';
import { UpdateTenantDto } from './dto';

@UseGuards(ClerkAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantService) {}

  // Look up a single business account (tenant) — the customer organization
  // that owns a ClientPulse dashboard. Used to load account details/settings.
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      throw new NotFoundException();
    }
    return tenant;
  }

  // Update a business account's profile: display name, URL slug, or lifecycle
  // status (active/suspended — e.g. offboarding a churned or non-paying
  // customer). Every change is recorded to the audit log for compliance.
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.tenants.update(id, body);
    if (!tenant) {
      throw new NotFoundException();
    }
    return tenant;
  }
}

@Module({
  imports: [AuthModule],
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
