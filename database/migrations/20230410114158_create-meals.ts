import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary().index();
    table.uuid('user_session_id').notNullable();
    table.string('name').notNullable();
    table.string('description').notNullable();
    table.datetime('date', { useTz: false }).notNullable();
    table.boolean('isCompliant').notNullable;
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals');
}

