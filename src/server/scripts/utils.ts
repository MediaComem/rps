import * as chalk from 'chalk';
import * as knex from 'knex';

import { loadConfig } from '../config';
import { createDatabase } from '../db';

export function runDatabaseScript(callback: (db: knex<any, unknown[]>) => Promise<void>) {
  Promise
    .resolve()
    .then(loadConfig)
    .then(createDatabase)
    .then(async db => {
      await callback(db);
      await db.destroy();
    })
    .catch(err => {
      console.error(chalk.red(err.stack));
      process.exit(1);
    });
}
