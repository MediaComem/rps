import * as chalk from 'chalk';

import { loadConfig } from './config';
import { start as startServer } from './server';

Promise
  .resolve()
  .then(loadConfig)
  .then(startServer)
  .catch(err => {
    console.error(chalk.red(err.stack));
    process.exit(1);
  });
