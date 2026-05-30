import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { CLERK_CLIENT } from './clerk.provider';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { WsAuthGuard } from './ws-auth.guard';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({})),
  verifyToken: jest.fn(),
}));

describe('AuthModule', () => {
  it('provides CLERK_CLIENT, ClerkAuthGuard, and WsAuthGuard', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(moduleRef.get(CLERK_CLIENT)).toBeDefined();
    expect(moduleRef.get(ClerkAuthGuard)).toBeInstanceOf(ClerkAuthGuard);
    expect(moduleRef.get(WsAuthGuard)).toBeInstanceOf(WsAuthGuard);
  });
});
