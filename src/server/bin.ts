import * as chalk from 'chalk';

import { loadConfig } from './config';
import { createDatabase } from './db';
import { start as startServer } from './server';

Promise
  .resolve()
  .then(loadConfig)
  .then(async config => {
    const db = await createDatabase(config);
    return startServer(config, db);
  })
  .catch(err => {
    console.error(chalk.red(err.stack));
    process.exit(1);
  });
