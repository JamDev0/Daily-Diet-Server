import { FastifyReply, FastifyRequest } from 'fastify';

export async function checkIfUserSessionIdExists(req: FastifyRequest, res: FastifyReply) {
  const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

  if(!userSessionId) {
    return res.code(401).send({ message: 'login to access meals' });
  }
}