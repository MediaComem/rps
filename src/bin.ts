import * as chalk from 'chalk';

import { start } from './server';

Promise.resolve().then(start).catch(err => {
  console.error(chalk.red(err.stack));
  process.exit(1);
});
