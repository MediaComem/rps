import * as debugFactory from 'debug';
import * as Knex from 'knex';
import createSubscriber, { Subscriber } from 'pg-listen';

import { Config } from './config';

export interface Database {
  readonly knex: Knex;
  readonly subscriber: Subscriber;
}

const debug = debugFactory('rps:db');

export async function createDatabase({ database: config }: Config): Promise<Database> {

  const knex = Knex(config);

  // Ensure the database can be reached.
  const result = await knex.raw('SELECT 1 + 2 AS count;');
  if (!Array.isArray(result.rows) || result.rows.length !== 1 || result.rows[0].count !== 3) {
    throw new Error('Could not successfully run database query');
  }

  debug('Connected to the database');

  // Subscribe to notifications.
  const subscriber = createSubscriber({
    connectionString: config.connection
  });

  // Exit on subscription error.
  subscriber.events.on('error', err => {
    console.error('Fatal database subscription error:', err)
    process.exit(2);
  });

  await subscriber.connect();
  await subscriber.listenTo('games:created');

  debug('Subscribed to database notifications');

  return { knex, subscriber };
}
