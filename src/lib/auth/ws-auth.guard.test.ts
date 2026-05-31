import type { ExecutionContext } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { WsAuthGuard } from './ws-auth.guard';
import type { Socket } from 'socket.io';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

function makeContext(
  authToken?: string,
  queryToken?: string,
): {
  ctx: ExecutionContext;
  socket: {
    id: string;
    data: Record<string, unknown>;
    handshake: {
      auth: Record<string, unknown>;
      query: Record<string, unknown>;
    };
  };
} {
  const socket = {
    id: 'socket-1',
    data: {} as Record<string, unknown>,
    handshake: {
      auth: authToken !== undefined ? { token: authToken } : {},
      query: queryToken !== undefined ? { token: queryToken } : {},
    },
  };
  const ctx = {
    switchToWs: () => ({ getClient: () => socket as unknown as Socket }),
  } as unknown as ExecutionContext;
  return { ctx, socket };
}

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;

  beforeEach(() => {
    guard = new WsAuthGuard();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true and attaches auth for a valid token in handshake.auth', async () => {
    const payload = { sub: 'user_123' };
    mockVerifyToken.mockResolvedValue(payload as never);

    const { ctx, socket } = makeContext('valid-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBeTruthy();
    expect(socket.data.auth).toEqual(payload);
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });

  it('returns true for a valid token in handshake.query when auth has no token', async () => {
    const payload = { sub: 'user_456' };
    mockVerifyToken.mockResolvedValue(payload as never);

    const { ctx } = makeContext(undefined, 'query-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBeTruthy();
    expect(mockVerifyToken).toHaveBeenCalledWith('query-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });

  it('returns false when no token is present in auth or query', async () => {
    const { ctx } = makeContext();
    const result = await guard.canActivate(ctx);

    expect(result).toBeFalsy();
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('returns false when verifyToken rejects with an Error', async () => {
    mockVerifyToken.mockRejectedValue(new Error('invalid token'));

    const { ctx } = makeContext('bad-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBeFalsy();
  });

  it('returns false when verifyToken rejects with a non-Error value', async () => {
    mockVerifyToken.mockRejectedValue('expired');

    const { ctx } = makeContext('bad-token');
    const result = await guard.canActivate(ctx);

    expect(result).toBeFalsy();
  });
});
