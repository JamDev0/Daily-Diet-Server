import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().index();
    table.string('user_name').notNullable();
    table.string('password').notNullable;
  });

  await knex.schema.createTable('session_ids', (table) => {
    table.uuid('value').primary().index();
    table.uuid('user_id').unsigned().notNullable().index();
    table.foreign('user_id').references('id').inTable('user').onDelete('CASCADE').onUpdate('CASCADE');
    table.date('expire_date').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');

  await knex.schema.dropTable('session_ids');
}

