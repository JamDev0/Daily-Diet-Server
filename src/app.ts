import cookiesPlugin from '@fastify/cookie';
import fastify from 'fastify';
import { mealsRoutes } from './routes/meals';

export const app = fastify();

app.register(cookiesPlugin);

app.register(mealsRoutes, {
  prefix: 'meals'
});