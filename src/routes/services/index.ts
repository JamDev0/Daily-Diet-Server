import { FastifyInstance } from 'fastify';
import { createHash, randomUUID } from 'node:crypto';
import zod from 'zod';
import { knex } from '../../services/database';

export async function servicesRoutes(server: FastifyInstance) {
  server.post('/login', async (req, res) => {
    const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

    if(userSessionId) return res.code(403).send({ message: 'already logged in' });

    const bodyReqSchema = zod.object({
      user_name: zod.string(),
      password: zod.string()
    });

    const body = bodyReqSchema.parse(req.body);

    const hashedPassword = createHash('sha256').update(body.password).digest('hex');

    const getUserId = await knex('users').where({ ...body , password: hashedPassword }).select('id').first();

    if(!getUserId) return res.code(401).send( { message: 'Invalid user name or password' } );

    const expireDate = new Date();

    expireDate.setHours(expireDate.getHours() + 24);

    const createdUserSessionId = (await knex('session_ids').insert({ expire_date: expireDate, user_id: getUserId.id, value: randomUUID() }).returning('value'))[0];

    res.cookie('daily-diet.user_session_id', createdUserSessionId.value, {
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
      path: '/'
    });
    
    return res.code(204).send();
  });
}