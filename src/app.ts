import * as express from 'express';
import { json as parseJson, NextFunction, Request, Response, static as serveStatic } from 'express';
import * as logger from 'morgan';
import { join as joinPath } from 'path';
import { middleware as compileStylus } from 'stylus';

import { root } from './config';
import { isHttpStatus, isObject } from './utils';

const publicDir = joinPath(root, 'public');
const viewsDir = joinPath(root, 'views');

export const app = express();

// Set up the view engine.
app.set('views', viewsDir);
app.set('view engine', 'pug');

// Plug in generic middleware.
app.use(logger('dev'));
app.use(parseJson());
app.use(compileStylus(publicDir));
app.use(serveStatic(publicDir));

// Serve home page.
app.get('/*', (_req, res) => res.render('index', { title: 'Express' }));

// Global error handler.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // Set locals, only providing error in development.
  res.locals.message = err instanceof Error ? err.message : 'An unexpected error occurred';
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page.
  res.status(getHttpStatusForError(err));
  res.render('error');
});

function getHttpStatusForError(err: unknown): number {
  return isObject(err) && isHttpStatus(err.status) ? err.status : 500;
}
