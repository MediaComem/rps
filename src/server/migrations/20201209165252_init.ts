import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('CREATE EXTENSION "uuid-ossp";');

  await knex.schema.createTable('games', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('first_player_id').notNullable();
    t.string('first_player_name', 50).notNullable();
    t.enum('first_player_move', [ 'rock', 'paper', 'scissors' ]);
    t.uuid('second_player_id');
    t.string('second_player_name', 50);
    t.enum('second_player_move', [ 'rock', 'paper', 'scissors' ]);
    t.enum(
      'state',
      [ 'waiting_for_player', 'ongoing', 'done' ]
    ).notNullable().defaultTo('waiting_for_player');
  });

  await knex.schema.raw(`
    ALTER TABLE games
    ADD CONSTRAINT check_second_player_data
    CHECK (
      (second_player_id IS NULL AND second_player_name IS NULL AND second_player_move IS NULL) OR
      (second_player_id IS NOT NULL AND second_player_name IS NOT NULL)
    );
  `);

  await knex.schema.raw(`
    ALTER TABLE games
    ADD CONSTRAINT check_state
    CHECK (
      (state = 'waiting_for_player' AND first_player_move IS NULL AND second_player_move IS NULL) OR
      (state = 'ongoing' AND (first_player_move IS NULL OR second_player_move IS NULL)) OR
      state = 'done'
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('games');
  await knex.schema.raw('DROP EXTENSION "uuid-ossp";');
}
