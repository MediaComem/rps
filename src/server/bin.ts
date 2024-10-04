import chalk from 'chalk';

import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { start as startServer } from './server.js';

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
