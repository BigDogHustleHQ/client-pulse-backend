import { createServer } from 'http';
import { createWebSocketModule } from './index';

describe('WebSocket module', () => {
  it('attaches a Socket.io server to the http server', () => {
    const httpServer = createServer();
    const io = createWebSocketModule(httpServer);
    expect(io).toBeDefined();
    io.close();
  });
});
