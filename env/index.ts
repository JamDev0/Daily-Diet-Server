import { config } from 'dotenv';

import zod from 'zod';

if(process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
} else {
  config();
}

const envSchema = zod.object({
  NODE_ENV: zod.enum(['production', 'development', 'test']).default('production'),
  PORT: zod.coerce.number(),
  DATABASE_ENGINE: zod.enum(['pg', 'sqlite']),
  DATABASE_URL: zod.string()
});


const _env = envSchema.safeParse(process.env);

if(_env.success === false) {
  throw new Error(`Invalid environment variables. ${_env.error.format()}`);
}

export const env = _env.data;