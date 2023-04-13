import cookiesPlugin from '@fastify/cookie';
import fastify from 'fastify';
import { mealsRoutes } from './routes/meals';
import { servicesRoutes } from './routes/services';
import { usersRoutes } from './routes/users';

export const app = fastify();

app.register(cookiesPlugin);

app.register(mealsRoutes, {
  prefix: 'meals'
});

app.register(usersRoutes, {
  prefix: 'users'
});

app.register(servicesRoutes, {
  prefix: 'services'
});