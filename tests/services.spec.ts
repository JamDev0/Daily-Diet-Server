import { execSync } from 'child_process';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('Services routes', () => {
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

  it('Should be able to login after create user', async () => {
    const userData = {
      user_name: 'John Doe',
      password: '1263546s'
    };
    
    await request(app.server)
      .post('/users')
      .send(userData);

    const loginResponse = await request(app.server)
      .post('/services/login')
      .send(userData);

    expect(loginResponse.statusCode).toBe(204);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();
  });
});