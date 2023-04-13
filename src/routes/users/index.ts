import { FastifyInstance } from 'fastify';
import { createHash, randomUUID } from 'node:crypto';
import zod from 'zod';
import { knex } from '../../services/database';

export async function usersRoutes(server: FastifyInstance) {
  server.post(
    '/',
    async (req, res) => {
      const reqBodySchema = zod.object({
        user_name: zod.string(),
        password: zod.string()
      });

      const body = reqBodySchema.parse(req.body);

      const hashedPassword = createHash('sha256').update(body.password).digest('hex');

      const userId = (await knex('users').insert({...body, id: randomUUID(), password: hashedPassword}).returning('id'))[0].id;

      if(userId) return res.code(201).send({ userId });

      return res.code(400).send({ message: 'Error while creating user' });
    }
  );

  server.delete(
    '/:id',
    async (req, res) => {
      const paramsSchema = zod.object({
        id: zod.string(),
      });
      
      const { id } = paramsSchema.parse(req.params);

      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

      const isUserIdValid = !!(await knex('session_ids').where({value: userSessionId, user_id: id}).first());

      if(!isUserIdValid) return res.code(401).send({ message: 'Invalid session_id or user id' });
      
      const entriesDeleted = await knex('users').where({ id }).delete();

      if(entriesDeleted > 0) return res.code(204).send();

      return res.code(500).send({ message: 'Server error' });
    }
  );
}