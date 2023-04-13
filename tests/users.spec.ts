import { execSync } from 'child_process';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { app } from '../src/app';


describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex -- migrate:rollback --all');
    execSync('npm run knex -- migrate:latest');
  });

  it('should be able to create a user', async () => {
    const createUserResponse = await request(app.server).post('/users').send({
      user_name: 'John Doe',
      password: '123456P',
    });

    expect(createUserResponse.statusCode).toBe(201);
    expectTypeOf(createUserResponse.body.userId).toBeString();
  });

  it('should be able to delete its user only when logged in', async () => {
    const userLoginData = {
      user_name: 'John Doe',
      password: '123456P',
    };
    
    const createUserResponse = await request(app.server).post('/users').send(userLoginData);

    const userId = createUserResponse.body.userId;

    const loginResponse = await request(app.server).post('/services/login').send(userLoginData);

    const loginCookies = loginResponse.get('Set-Cookie');

    const tryToDeleteUserResponse =  await request(app.server).delete(`/users/${userId}`);

    expect(tryToDeleteUserResponse.statusCode).toBe(500);
    
    const deleteUserResponse =  await request(app.server).delete(`/users/${userId}`).set('Cookie', loginCookies);

    expect(deleteUserResponse.statusCode).toBe(204);
  });
});