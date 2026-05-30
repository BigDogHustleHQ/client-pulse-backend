import { Global, Module } from '@nestjs/common';
import { CLERK_CLIENT, clerkProvider } from './clerk.provider';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { WsAuthGuard } from './ws-auth.guard';

@Global()
@Module({
  providers: [clerkProvider, ClerkAuthGuard, WsAuthGuard],
  exports: [CLERK_CLIENT, ClerkAuthGuard, WsAuthGuard],
})
export class AuthModule {}
