import * as express from 'express';
import { json as parseJson, NextFunction, Request, Response, static as serveStatic } from 'express';
import * as logger from 'morgan';
import { join as joinPath } from 'path';

import { root } from './config';
import { isHttpStatus, isObject } from './utils';

export function createApplication() {

  const publicDir = joinPath(root, 'public');

  const app = express();

  // Plug in generic middleware.
  app.use(logger('dev'));
  app.use(parseJson());

  // Serve the frontend website.
  app.use(serveStatic(publicDir));

  // Plug in application middleware.
  app.use(globalErrorHandler);

  return app;
}

function getHttpStatusForError(err: unknown): number {
  return isObject(err) && isHttpStatus(err.status) ? err.status : 500;
}

function globalErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Provide full error stack only in development.
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';

  // Render the error message.
  res
    .status(getHttpStatusForError(err))
    .set('Content-Type', 'text/plain')
    .send(message);
}
