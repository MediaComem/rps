import debugFactory from 'debug';
import knex, { Knex } from 'knex';
import createSubscriber, { Subscriber } from 'pg-listen';

import { Config } from './config.js';

const { knex: knexFactory } = knex;

export interface Database {
  readonly knex: Knex;
  readonly subscriber: Subscriber;
}

const debug = debugFactory('rps:db');

export async function createDatabase({ database: config, migrate }: Config): Promise<Database> {

  const knex = knexFactory(config);

  // Ensure the database can be reached.
  const result = await knex.raw('SELECT 1 + 2 AS count;');
  if (!Array.isArray(result.rows) || result.rows.length !== 1 || result.rows[0].count !== 3) {
    throw new Error('Could not successfully run database query');
  }

  debug('Connected to the database');

  if (migrate) {
    debug('Migrating the database...');
    await knex.migrate.latest(config.migrations);
    debug('Database successfully migrated to the latest version');
  }

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

  await Promise.all([
    subscriber.listenTo('games:created'),
    subscriber.listenTo('games:joined'),
    subscriber.listenTo('games:played'),
    subscriber.listenTo('games:timeout')
  ]);

  debug('Subscribed to database notifications');

  // Timeout all incomplete games.
  await knex('games').update({ state: 'done' }).whereNot('state', 'done');

  return { knex, subscriber };
}
