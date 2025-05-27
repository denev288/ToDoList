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

  describe('Todo CRUD Operations', () => {
    let todoId;

    it('should create and read a todo', async () => {
      const todoData = {
        text: `CRUD Test Todo ${testId}`,
        description: `CRUD Description ${testId}`
      };

      const createResponse = await request(app)
        .post('/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      todoId = createResponse.body._id;
      expect(createResponse.status).toBe(201);

      // Verify we can read the todo
      const readResponse = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(readResponse.status).toBe(200);
      expect(Array.isArray(readResponse.body)).toBe(true);
      const createdTodo = readResponse.body.find(todo => todo._id === todoId);
      expect(createdTodo).toBeTruthy();
    });

    it('should update a todo', async () => {
      const updateData = {
        text: `Updated Todo ${testId}`,
        description: `Updated Description ${testId}`
      };

      const response = await request(app)
        .patch(`/edit/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.text).toBe(updateData.text);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should delete a todo', async () => {
      const response = await request(app)
        .delete(`/delete/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify the todo was deleted
      const checkResponse = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedTodo = checkResponse.body.find(todo => todo._id === todoId);
      expect(deletedTodo).toBeFalsy();
    });
  });  // end of CRUD Operations

  describe('Friend System and Todo Sharing', () => {
    let friendToken;
    let friendEmail;
    let sharedTodoId;

    it('should register a friend account', async () => {
      const friendData = {
        name: `Friend User ${testId}`,
        email: `friend.${testId}@example.com`,
        password: 'Friend123!@'
      };

      const response = await request(app)
        .post('/register')
        .send(friendData);

      friendToken = response.body.token;
      friendEmail = friendData.email;
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should send and accept friend request', async () => {
      // First search for the friend by email to get their ID
      const searchResponse = await request(app)
        .post('/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: friendEmail });

      expect(searchResponse.status).toBe(200);
      const friendId = searchResponse.body[0]._id;

      // Send friend request with the correct ID
      const sendRequest = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: friendId });

      expect(sendRequest.status).toBe(200);

      // Wait a moment for the request to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the pending request ID
      const pendingRequests = await request(app)
        .get('/friends/requests')
        .set('Authorization', `Bearer ${friendToken}`);

      expect(pendingRequests.status).toBe(200);
      expect(Array.isArray(pendingRequests.body)).toBe(true);
      expect(pendingRequests.body.length).toBeGreaterThan(0);

      const requestId = pendingRequests.body[0]._id;

      // Accept friend request
      const acceptRequest = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${friendToken}`)
        .send({
          requestId: requestId,
          action: 'accept'
        });

      expect(acceptRequest.status).toBe(200);

      // Wait for friend request to be fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should share a todo with friend', async () => {
      // Create a new todo to share
      const todoData = {
        text: `Shared Todo ${testId}`,
        description: `Shared Description ${testId}`
      };

      const createResponse = await request(app)
        .post('/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData);

      sharedTodoId = createResponse.body._id;
      expect(createResponse.status).toBe(201);

      // Share the todo
      const shareResponse = await request(app)
        .post(`/share/${sharedTodoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: friendEmail });

      expect(shareResponse.status).toBe(200);

      // Wait longer for the share operation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify friend can see the shared todo with better error handling
      try {
        const friendViewResponse = await request(app)
          .get('/tasks')  // Changed to /tasks to get all tasks including shared ones
          .set('Authorization', `Bearer ${friendToken}`);

        console.log('Friend View Response:', friendViewResponse.body); // Debug log

        expect(friendViewResponse.status).toBe(200);
        expect(Array.isArray(friendViewResponse.body)).toBe(true);
        const sharedTodo = friendViewResponse.body.find(todo => 
          todo.originalTaskId === sharedTodoId || todo._id === sharedTodoId
        );
        expect(sharedTodo).toBeTruthy();
      } catch (error) {
        console.error('Error getting shared tasks:', error);
        throw error;
      }
    });
  });
});
