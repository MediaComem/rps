import { Server as HttpServer } from 'http';
import { Server as WebSocketServer } from 'ws';

import { messageCodec } from '../common/messages';
import { decode, encodeMessage } from '../common/utils';

export function create(httpServer: HttpServer) {
  const webSocketServer = new WebSocketServer({ server: httpServer });

  webSocketServer.on('connection', function connection(client) {
    client.on('message', message => {
      if (typeof message !== 'string') {
        return;
      }

      const decoded = decode(messageCodec, message);
      console.log('received message: %s', decoded);
    });

    client.send(encodeMessage({
      topic: 'hello',
      event: 'hello',
      payload: 'hello'
    }));
  });
}
