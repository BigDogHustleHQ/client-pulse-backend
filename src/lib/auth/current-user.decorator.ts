import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export function currentUserFactory(
  _data: unknown,
  context: ExecutionContext,
): unknown {
  return context
    .switchToHttp()
    .getRequest<Request & { auth: unknown }>().auth;
}

export const CurrentUser = createParamDecorator(currentUserFactory);
