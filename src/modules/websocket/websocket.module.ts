import { Module } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { createModuleLogger } from '../../lib/logger/logger';

const log = createModuleLogger('websocket');

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection(client: Socket): void {
    log.info(`client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    log.info(`client disconnected: ${client.id}`);
  }
}

@Module({ providers: [WebsocketGateway] })
export class WebsocketModule {}
