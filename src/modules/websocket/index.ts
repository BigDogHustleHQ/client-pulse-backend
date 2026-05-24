import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

export function createWebSocketModule(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' },
  });

  /* istanbul ignore next */
  io.on('connection', (socket) => {
    console.log(`[websocket] client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[websocket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}
