import * as debugFactory from 'debug';
import * as Knex from 'knex';

import { Config } from './config';

const debug = debugFactory('rps:db');

export async function createDatabase({ database: config }: Config) {

  const db = Knex(config);

  // Ensure the database can be reached.
  const result = await db.raw('SELECT 1 + 2 AS count;');
  if (!Array.isArray(result.rows) || result.rows.length !== 1 || result.rows[0].count !== 3) {
    throw new Error('Could not successfully run database query');
  }

  debug('Connected to the database');

  return db;
}
