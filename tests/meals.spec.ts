import { addDays } from 'date-fns';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { app } from '../src/app';

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  it('should be able to create a new meal, receive its id and receive a cookie', async () => {
    const createNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      });

    

    expect(createNewMealResponse.statusCode).toBe(201);
    expectTypeOf(createNewMealResponse.body.mealId).toBeString();
    expectTypeOf(createNewMealResponse.get('Set-Cookie')).toBeObject();
  });

  it('should be able to only list meals it has created', async () => {
    const newMealBody = {
      name: 'Test',
      description: 'Some description',
      date: new Date().toISOString(),
      is_compliant: true,
    };
    
    const createNewMealResponse = await request(app.server)
      .post('/meals')
      .send(newMealBody);
    
    const { body: { mealId: newMealId } } = createNewMealResponse;

    const returnedCookies = createNewMealResponse.get('Set-Cookie');

    const getMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', returnedCookies);

    expect(getMealsResponse.body)
      .toEqual({ meals: [
        expect.objectContaining({
          ...newMealBody,
          id: newMealId,
          date: new Date(newMealBody.date).getTime(),
          is_compliant: Number(newMealBody.is_compliant)
        })
      ]});
    expect(getMealsResponse.statusCode).toBe(200);
  });

  it('should be able to edit previously created meals by its id', async () => {
    const createNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      });

    const cookies = createNewMealResponse.get('Set-Cookie');

    const newMealId = createNewMealResponse.body.mealId;

    const updateMealResponse = await request(app.server)
      .patch(`/meals/${newMealId}`)
      .set('Cookie', cookies)
      .send({
        name: 'Test update'
      });

    expect(updateMealResponse.statusCode).toBe(204);
  });

  it('should be able to delete previously created meals by its id', async () => {
    const createNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      });

    const cookies = createNewMealResponse.get('Set-Cookie');

    const newMealId = createNewMealResponse.body.mealId;

    const deleteMealResponse = await request(app.server)
      .delete(`/meals/${newMealId}`)
      .set('Cookie', cookies);

    expect(deleteMealResponse.statusCode).toBe(204);
  });

  it('should be able to get a previously created meals by its id', async () => {
    const newMealBody = {
      name: 'Test',
      description: 'Some description',
      date: new Date().toISOString(),
      is_compliant: true,
    };

    const createNewMealResponse = await request(app.server)
      .post('/meals')
      .send(newMealBody);

    const cookies = createNewMealResponse.get('Set-Cookie');

    const newMealId = createNewMealResponse.body.mealId;

    const getMealResponse = await request(app.server)
      .get(`/meals/${newMealId}`)
      .set('Cookie', cookies);

    expect(getMealResponse.body).toEqual({ meal: expect.objectContaining({
      ...newMealBody,
      id: newMealId,
      date: new Date(newMealBody.date).getTime(),
      is_compliant: Number(newMealBody.is_compliant)
    })});
  });

  it('should be able to get the total of created meals', async () => {
    const createFirstNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      });

    const cookies = createFirstNewMealResponse.get('Set-Cookie');

    const getFirstTotalMealsResponse = await request(app.server)
      .get('/meals/total')
      .set('Cookie', cookies);

    expect(getFirstTotalMealsResponse.body.totalMeals).toBe(1);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test 3',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);
    
    const getTotalMealsResponse = await request(app.server)
      .get('/meals/total')
      .set('Cookie', cookies);

    expect(getTotalMealsResponse.body.totalMeals).toBe(3);
  });

  it('should be able to get the total of created meals that are compliant', async () => {
    const createFirstNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      });

    const cookies = createFirstNewMealResponse.get('Set-Cookie');

    const getFirstTotalMealsResponse = await request(app.server)
      .get('/meals/total/compliant')
      .set('Cookie', cookies);

    expect(getFirstTotalMealsResponse.body.totalCompliantMeals).toBe(1);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: false,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test 3',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);
    
    const getTotalMealsResponse = await request(app.server)
      .get('/meals/total/compliant')
      .set('Cookie', cookies);

    expect(getTotalMealsResponse.body.totalCompliantMeals).toBe(2);
  });

  it('should be able to get the total of created meals that are noncompliant', async () => {
    const createFirstNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: false,
      });

    const cookies = createFirstNewMealResponse.get('Set-Cookie');

    const getFirstTotalMealsResponse = await request(app.server)
      .get('/meals/total/noncompliant')
      .set('Cookie', cookies);

    expect(getFirstTotalMealsResponse.body.totalNoncompliantMeals).toBe(1);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: false,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test 3',
        description: 'Some description',
        date: new Date().toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);
    
    const getTotalMealsResponse = await request(app.server)
      .get('/meals/total/noncompliant')
      .set('Cookie', cookies);

    expect(getTotalMealsResponse.body.totalNoncompliantMeals).toBe(2);
  });

  it('should be able to get the highest day streak of compliant meals', async () => {
    const initialDate = new Date();

    const createFirstNewMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: initialDate.toISOString(),
        is_compliant: true,
      });

    const cookies = createFirstNewMealResponse.get('Set-Cookie');

    const firstGetHighestStreakResponse = await request(app.server)
      .get('/meals/highest-compliant-streak')
      .set('Cookie', cookies);

    expect(firstGetHighestStreakResponse.body.highestStreak).toBe(1);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 1).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 2).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 3).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    const secondGetHighestStreakResponse = await request(app.server)
      .get('/meals/highest-compliant-streak')
      .set('Cookie', cookies);

    expect(secondGetHighestStreakResponse.body.highestStreak).toBe(4);


    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 6).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    const thirdGetHighestStreakResponse = await request(app.server)
      .get('/meals/highest-compliant-streak')
      .set('Cookie', cookies);

    expect(thirdGetHighestStreakResponse.body.highestStreak).toBe(4);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 7).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 7).toISOString(),
        is_compliant: false,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 8).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 9).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Test',
        description: 'Some description',
        date: addDays(initialDate, 10).toISOString(),
        is_compliant: true,
      })
      .set('Cookie', cookies);

    const getHighestStreakResponse = await request(app.server)
      .get('/meals/highest-compliant-streak')
      .set('Cookie', cookies);

    expect(getHighestStreakResponse.body.highestStreak).toBe(5);
  });
});