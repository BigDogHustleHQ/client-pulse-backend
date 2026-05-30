import type { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';

describe('currentUserFactory', () => {
  it('returns the auth payload from the HTTP request', () => {
    const auth = { sub: 'user_123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ auth }) }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, ctx)).toEqual(auth);
  });

  it('returns undefined when no auth is set on the request', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ auth: undefined }) }),
    } as unknown as ExecutionContext;

    expect(currentUserFactory(undefined, ctx)).toBeUndefined();
  });
});
