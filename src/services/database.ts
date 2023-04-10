import knexSetup, { Knex } from 'knex';
import { env } from '../../env';

export const config: Knex.Config = {
  client: env.DATABASE_ENGINE,
  connection: env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    directory: './database/migrations',
    extension: 'ts',
  }
};

export const knex = knexSetup(config);