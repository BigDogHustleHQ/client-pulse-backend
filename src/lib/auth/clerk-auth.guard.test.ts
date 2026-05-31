import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

function makeContext(authorization?: string): {
  ctx: ExecutionContext;
  request: {
    headers: Record<string, string>;
    auth: unknown;
    method: string;
    path: string;
  };
} {
  const request: {
    headers: Record<string, string>;
    auth: unknown;
    method: string;
    path: string;
  } = {
    headers: authorization ? { authorization } : {},
    auth: undefined,
    method: 'GET',
    path: '/tenants/test-id',
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    guard = new ClerkAuthGuard();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true and attaches auth payload for a valid Bearer token', async () => {
    const payload = { sub: 'user_123' };
    mockVerifyToken.mockResolvedValue(payload as never);

    const { ctx, request } = makeContext('Bearer valid-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBeTruthy();
    expect(request.auth).toEqual(payload);
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });

  it('throws UnauthorizedException when the Authorization header is absent', async () => {
    const { ctx } = makeContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the Authorization header is not Bearer', async () => {
    const { ctx } = makeContext('Basic some-credentials');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when verifyToken rejects with an Error', async () => {
    mockVerifyToken.mockRejectedValue(new Error('invalid token'));
    const { ctx } = makeContext('Bearer bad-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when verifyToken rejects with a non-Error value', async () => {
    mockVerifyToken.mockRejectedValue('expired');
    const { ctx } = makeContext('Bearer bad-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
