import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.renameColumn('user_session_id', 'user_id');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.renameColumn('user_id', 'user_session_id');
  });
}

