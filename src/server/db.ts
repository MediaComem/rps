import * as knex from 'knex';

import { Config } from './config';

export async function createDatabase({ database: config }: Config) {

  const db = knex(config);

  // Ensure the database can be reached.
  const result = await db.raw('SELECT 1 + 2 AS count;');
  if (!Array.isArray(result.rows) || result.rows.length !== 1 || result.rows[0].count !== 3) {
    throw new Error('Could not successfully run database query');
  }

  return db;
}
