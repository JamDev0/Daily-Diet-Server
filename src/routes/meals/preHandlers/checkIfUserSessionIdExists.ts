import { FastifyReply, FastifyRequest } from 'fastify';
import { knex } from '../../../services/database';

export async function checkIfUserSessionIdExists(req: FastifyRequest, res: FastifyReply) {
  const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

  const teste = await knex('session_ids').where('value', userSessionId).andWhere('expire_date', '>=', new Date().getTime()).first();

  if(!teste) {
    return res.code(401).send({ message: 'login to access meals' });
  }
}