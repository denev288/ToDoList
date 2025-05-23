const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../index');
const TodoModel = require('../../models/Todo');
const User = require('../../models/UserModel');

// Mock auth middleware
jest.mock('../../middleware/requireAuth', () => {
  return (req, res, next) => {
    if (!req.headers.testuser) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    req.user = { _id: req.headers.testuser };
    next();
  };
});

jest.mock('../../models/Todo');
jest.mock('../../models/UserModel');

describe('Todo Controller', () => {
  let testUser;
  let testTodo;

  beforeEach(() => {
    jest.resetAllMocks();
    testUser = { 
      _id: new mongoose.Types.ObjectId(),
      toString: function() { return this._id.toString(); }
    };
    testTodo = {
      _id: new mongoose.Types.ObjectId(),
      text: 'Test todo',
      description: 'Test description',
      user_id: testUser._id,
      completed: false,
      toJSON: function() {
        return {
          ...this,
          _id: this._id,
          user_id: this.user_id
        };
      }
    };
  });

  describe('GET /tasks', () => {
    it('should fetch all tasks for user', async () => {
      TodoModel.find.mockResolvedValue([testTodo]);
      const expectedQuery = { user_id: testUser._id.toString() };

      const response = await request(app)
        .get('/tasks')
        .set('testuser', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(TodoModel.find).toHaveBeenCalledWith(expectedQuery);
    });

    it('should handle database errors when fetching tasks', async () => {
      TodoModel.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/tasks')
        .set('testuser', testUser._id.toString());

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch tasks');
    });

    it('should handle unauthenticated user', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('testuser', '');  

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized: User not authenticated');
    });
  }); 

  describe('POST /add', () => {
    it('should add a new task', async () => {
      const newTodo = {
        text: 'New task',
        description: 'New description'
      };

      const createdTodo = {
        ...newTodo,
        _id: new mongoose.Types.ObjectId(),
        user_id: testUser._id.toString(),
        completed: false
      };

      TodoModel.create.mockResolvedValue(createdTodo);

      const response = await request(app)
        .post('/add')
        .set('testuser', testUser._id.toString())
        .send(newTodo);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('text', newTodo.text);
      expect(TodoModel.create).toHaveBeenCalledWith({
        ...newTodo,
        completed: false,
        user_id: testUser._id.toString()
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/add')
        .set('testuser', testUser._id.toString())
        .send({ description: 'Missing text field' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task text is required');
    });

    it('should handle missing user authentication', async () => {
      const newTodo = {
        text: 'New task',
        description: 'New description'
      };

     
      const response = await request(app)
        .post('/add')
        .send(newTodo);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized: User not authenticated');
    });

    it('should handle errors in addTask', async () => {
      const newTodo = {
        text: 'New task',
        description: 'New description'
      };

      TodoModel.create.mockRejectedValue(new Error('Error in addTask'));

      const response = await request(app)
        .post('/add')
        .set('testuser', testUser._id.toString())
        .send(newTodo);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to add task');
    });
  });

  describe('DELETE /delete/:id', () => {
    it('should delete a task', async () => {
      const todoToReturn = {
        _id: testTodo._id.toString(),
        text: testTodo.text,
        description: testTodo.description,
        user_id: testTodo.user_id.toString(),
        completed: testTodo.completed
      };
      TodoModel.findByIdAndDelete.mockResolvedValue(todoToReturn);

      const response = await request(app)
        .delete(`/delete/${testTodo._id}`)
        .set('testuser', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toEqual(todoToReturn);
    });

    it('should handle non-existent task', async () => {
      TodoModel.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/delete/${testTodo._id}`)
        .set('testuser', testUser._id.toString());

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /update/:id', () => {
    beforeEach(() => {
      jest.mock('../../controllers/taskController', () => ({
        syncTaskCompletion: jest.fn()
      }));
    });

    afterEach(() => {
      jest.resetModules();
    });

    it('should update task completion status', async () => {
      TodoModel.findByIdAndUpdate.mockResolvedValue({
        ...testTodo,
        completed: true
      });

      const response = await request(app)
        .patch(`/update/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(TodoModel.findByIdAndUpdate).toHaveBeenCalledWith(
        testTodo._id.toString(),
        { completed: true },
        { new: true }
      );
    }); 

    it('should handle database errors on update', async () => {
      TodoModel.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch(`/update/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send({ completed: true });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update task');
    });

    it('should handle non-existent task', async () => {
      TodoModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/update/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  }); 

  describe('PATCH /edit/:id', () => {
    it('should edit task text and description', async () => {
      const updates = {
        text: 'Updated text',
        description: 'Updated description'
      };

      TodoModel.findByIdAndUpdate.mockResolvedValue({
        ...testTodo,
        ...updates
      });

      const response = await request(app)
        .patch(`/edit/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updates);
    });

    it('should handle non-existent task during edit', async () => {
      TodoModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/edit/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send({ text: 'New text' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should handle database errors during edit', async () => {
      TodoModel.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch(`/edit/${testTodo._id}`)
        .set('testuser', testUser._id.toString())
        .send({ text: 'New text' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to edit task');
    });
  }); 
}); 
