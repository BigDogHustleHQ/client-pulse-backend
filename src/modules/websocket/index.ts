import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createModuleLogger } from '../logger';

const log = createModuleLogger('websocket');

export function createWebSocketModule(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' },
  });

  /* istanbul ignore next */
  io.on('connection', (socket) => {
    log.info(`client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      log.info(`client disconnected: ${socket.id}`);
    });
  });

  return io;
}
