import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Socket } from 'socket.io';
import { createModuleLogger } from '../logger/logger';

const log = createModuleLogger('auth');

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token =
      (client.handshake.auth as Record<string, unknown>)['token'] ??
      (client.handshake.query as Record<string, unknown>)['token'];

    if (!token) {
      return false;
    }

    try {
      const payload = await verifyToken(token as string, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      client.data.auth = payload;

      log.info('ws client authenticated', {
        eventId: 'auth-ws-verified',
        socketId: client.id,
      });
      return true;
    } catch (err) {
      log.error('ws token verification failed', {
        eventId: 'auth-ws-token-invalid',
        socketId: client.id,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}
