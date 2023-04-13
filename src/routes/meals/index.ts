import { randomUUID } from 'crypto';
import { isSameDay, sub } from 'date-fns';
import { FastifyInstance } from 'fastify';
import zod from 'zod';
import { knex } from '../../services/database';
import { checkIfUserSessionIdExists } from './preHandlers/checkIfUserSessionIdExists';

export async function mealsRoutes(server: FastifyInstance) {
  server.post('/', async (req, res) => {
    let userSessionId = req.cookies['daily-diet.user_session_id'];

    if(!userSessionId) {
      userSessionId = randomUUID();

      res.cookie('daily-diet.user_session_id', userSessionId, {
        maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
        path: '/'
      });
    }

    const bodySchema = zod.object({
      name: zod.string(),
      description: zod.string(),
      date: zod.string().datetime(),
      is_compliant: zod.boolean(),
    });

    const body = bodySchema.parse(req.body);

    const mealId = (await knex('meals').insert({ ...body, id: randomUUID(), user_session_id: userSessionId, date: new Date(body.date) }).returning('id'))[0].id;

    if(!mealId) {
      return res.code(500).send({ message: 'A error happen while creating a new meal entry!' });
    }

    return res.code(201).send({ mealId });
  });

  
  server.get(
    '/', 
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

      const querySchema = zod.object({
        name: zod.string().optional(),
        description: zod.string().optional(),
        date: zod.string().datetime().optional(),
        is_compliant: zod.boolean().optional(),
        order: zod.enum(['asc', 'desc']).optional(),
        sort_by: zod.enum(['name', 'description', 'date']).optional()
      });
      
      const { order, date, description, is_compliant, name, sort_by } = querySchema.parse(req.query);
      
      const meals = await knex('meals').where('user_session_id', userSessionId).modify(queryBuilder => {
        if(name) {
          queryBuilder.whereRaw('LOWER(name) LIKE ?', [`%${name.toLowerCase()}%`]);
        }
        
        if(is_compliant) {
          queryBuilder.where({ is_compliant });
        }
        
        if(date) {
          queryBuilder.where('date', new Date(date));
        }
        
        if(description) {
          queryBuilder.whereRaw('LOWER(description) LIKE ?', [`%${description.toLowerCase()}%`]);
        }
        
        queryBuilder.orderBy(sort_by ?? 'name' , order ?? 'asc');
      });
      
      return { meals };
    });
    
  server.patch(
    '/:id', 
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
  
      const paramsSchema = zod.object({
        id: zod.string().uuid()
      });
  
      const { id } = paramsSchema.parse(req.params);
  
      const bodySchema = zod.object({
        name: zod.string().optional(),
        description: zod.string().optional(),
        date: zod.coerce.date().optional(),
        is_compliant: zod.boolean().optional(),
      });
  
      const body = bodySchema.parse(req.body);
  
      const entriesUpdated = await knex('meals')
        .where({
          user_session_id: userSessionId,
          id
        })
        .update(body);
  
      if(entriesUpdated === 0) {
        return res.code(404).send({ message: `No meal found with id ${id} in current session.`});
      }
  
      return res.code(204).send();
    });

  server.delete(
    '/:id',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
      
      const paramsSchema = zod.object({
        id: zod.string().uuid()
      });
  
      const { id } = paramsSchema.parse(req.params);

      const entriesDeleted = await knex('meals').where({id, user_session_id: userSessionId}).delete();

      if(entriesDeleted === 0) {
        return res.code(404).send({ message: `No meal found with id ${id} in current session.`});
      }
  
      return res.code(204).send();
    }
  );

  server.get(
    '/:id',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
      
      const paramsSchema = zod.object({
        id: zod.string().uuid()
      });
  
      const { id } = paramsSchema.parse(req.params);

      const meal = await knex('meals').where({id, user_session_id: userSessionId}).first();

      if(!meal) {
        return res.code(404).send({ message: `No meal found with id ${id} in current session.`});
      }

      return { meal };
    }
  );

  server.get(
    '/total',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
      
      const mealsKnexCount = await knex('meals').where('user_session_id', userSessionId).count().first();

      if(mealsKnexCount) {
        const totalMeals = mealsKnexCount['count(*)'];

        return { totalMeals };
      }

      return res.code(500);
    }
  );

  server.get(
    '/total/compliant',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
      
      const mealsKnexCount = await knex('meals')
        .where({
          user_session_id: userSessionId,
          is_compliant: true
        })
        .count()
        .first();

      if(mealsKnexCount) {
        const totalCompliantMeals = mealsKnexCount['count(*)'];

        return { totalCompliantMeals };
      }

      return res.code(500);
    }
  );

  server.get(
    '/total/noncompliant',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;
      
      const mealsKnexCount = await knex('meals')
        .where({
          user_session_id: userSessionId,
          is_compliant: false
        })
        .count()
        .first();

      if(mealsKnexCount) {
        const totalNoncompliantMeals = mealsKnexCount['count(*)'];

        return { totalNoncompliantMeals };
      }

      return res.code(500);
    }
  );

  server.get(
    '/highest-compliant-streak',
    {
      preHandler: [checkIfUserSessionIdExists]
    },
    async (req, res) => {
      const userSessionId = req.cookies['daily-diet.user_session_id'] as string;

      const compliantMealsDate = await knex('meals')
        .column('date')
        .where({ 
          user_session_id: userSessionId, 
          is_compliant: true 
        })
        .orderBy('date');

      const dates = compliantMealsDate.map(date => new Date(date.date));

      if(dates.length === 1) {
        return { highestStreak: 1 };
      }

      let highestStreak = 0;

      const lastStreakCount = dates.reduce((acc, date, index, array) => {
        const nextDateLessOne = sub(array[index + 1], { days: 1 });

        const lastIndex = array.length - 1;

        highestStreak = acc > highestStreak ? acc : highestStreak;

        return index === lastIndex ? 
          acc
          : 
          isSameDay(date, nextDateLessOne) ? 
            acc + 1 
            : 
            1;
      }, 1);
      
      return { highestStreak };
    }
  );
} 