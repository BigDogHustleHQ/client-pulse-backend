import { Socket } from 'socket.io';
import { WebsocketGateway } from './index';

describe('WebsocketGateway', () => {
  const client = { id: 'socket-1' } as unknown as Socket;

  it('handles a client connection without throwing', () => {
    const gateway = new WebsocketGateway();
    expect(() => gateway.handleConnection(client)).not.toThrow();
  });

  it('handles a client disconnection without throwing', () => {
    const gateway = new WebsocketGateway();
    expect(() => gateway.handleDisconnect(client)).not.toThrow();
  });
});
