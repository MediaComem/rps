import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('CREATE EXTENSION "uuid-ossp";');
  await knex.schema.createTable('games', t => {
    t.uuid('id').primary();
    t.uuid('first_player_id').notNullable();
    t.string('first_player_name', 50).notNullable();
    t.uuid('second_player_id');
    t.string('second_player_name', 50);
    t.enum('state', [ 'created', 'ongoing', 'complete' ]).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('games');
  await knex.schema.raw('DROP EXTENSION "uuid-ossp";');
}
