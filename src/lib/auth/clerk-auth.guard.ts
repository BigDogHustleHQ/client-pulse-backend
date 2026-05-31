import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { createModuleLogger } from '../logger/logger';

const log = createModuleLogger('auth');

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth: unknown }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      request.auth = payload;

      log.info('request authenticated', {
        eventId: 'auth-http-verified',
        method: request.method,
        path: request.path,
      });
      return true;
    } catch (err) {
      log.error('token verification failed', {
        eventId: 'auth-http-token-invalid',
        method: request.method,
        path: request.path,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new UnauthorizedException();
    }
  }
}
