import * as debugFactory from 'debug';
import { createServer as createHttpServer } from 'http';

import { createApplication } from './app';
import { Config } from './config';
import { Database } from './db';
import { createWebSocketServer } from './wss';

const debug = debugFactory('rps:server');

export function start({ port }: Config, db: Database): Promise<void> {

  const app = createApplication()
  app.set('port', port);

  const server = createHttpServer(app);
  createWebSocketServer(db, server);

  return new Promise((resolve, reject) => {
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    function onError(err: NodeJS.ErrnoException) {
      if (err.syscall !== 'listen') {
        return reject(err);
      }

      // Handle specific listen errors with friendly messages.
      switch (err.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          return reject(err);
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          return reject(err);
        default:
          return reject(err);
      }
    }

    function onListening() {
      debug(`Listening on port ${port}`);
      resolve();
    }
  });
}
