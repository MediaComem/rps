import { Server as HttpServer } from 'http';
import { Server as WebSocketServer } from 'ws';

export function create(httpServer: HttpServer) {
  const webSocketServer = new WebSocketServer({ server: httpServer });

  webSocketServer.on('connection', function connection(client) {
    client.on('message', message => {
      console.log('received message: %s', message);
    });

    client.send('hello');
  });
}
