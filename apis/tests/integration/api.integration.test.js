const request = require('supertest');
const { setupTestDatabase, closeTestDatabase, getUniqueIdentifier } = require('./testSetup');
const app = require('../../index');

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let testId;

  beforeAll(async () => {
    await setupTestDatabase();
    // Get a single ID to use for both user and todos
    testId = await getUniqueIdentifier();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('User Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        name: `Test User ${testId}`,
        email: `test.${testId}@example.com`,
        password: 'Test123!@'
      };

      const response = await request(app)
        .post('/register')
        .send(userData);

      console.log('Created user:', userData.name);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });

    it('should create a todo for the user', async () => {
      const todoData = {
        text: `Test Todo ${testId}`,
        description: `Description for todo ${testId}`
      };

      const response = await request(app)
        .post('/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      console.log('Created todo:', todoData.text);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('text', todoData.text);
      expect(response.body).toHaveProperty('description', todoData.description);
    });
  });
});
