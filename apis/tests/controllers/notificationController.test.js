const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../index');
const UserModel = require('../../models/UserModel');
const NotificationModel = require('../../models/NotificationModel');
const jwt = require('jsonwebtoken');

describe('Notification Controller', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Clear database collections
    await UserModel.deleteMany({});
    await NotificationModel.deleteMany({});
    
    // Create test user
    testUser = await UserModel.create({
      name: "Test User",
      email: `test${Date.now()}@test.com`,
      password: "Test123!"
    });
    
    // Create auth token
    authToken = jwt.sign(
      { _id: testUser._id },
      process.env.SECRET || 'testsecret'
    );
  });

  describe('GET /notifications', () => {
    it('should fetch user notifications successfully', async () => {
      // Create test notifications
      await NotificationModel.create([
        {
          userId: testUser._id,
          type: 'task',
          message: 'Test notification 1',
          read: false
        },
        {
          userId: testUser._id,
          type: 'friend_request',
          message: 'Test notification 2',
          read: false
        }
      ]);

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.map(n => n.message)).toEqual(
        expect.arrayContaining(['Test notification 1', 'Test notification 2'])
      );
    });

    it('should handle errors when fetching notifications', async () => {
      const invalidToken = jwt.sign(
        { _id: 'invalid-id' },
        process.env.SECRET || 'testsecret'
      );

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Request is not authorized');
    });
  });

  describe('POST /notifications/read', () => {
    it('should mark notifications as read', async () => {
      // Create unread notifications
      await NotificationModel.create([
        {
          userId: testUser._id,
          type: 'task',
          message: 'Unread notification',
          read: false
        }
      ]);

      const response = await request(app)
        .post('/notifications/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notifications marked as read');

      // Verify notifications are marked as read
      const notifications = await NotificationModel.find({ userId: testUser._id });
      expect(notifications[0].read).toBe(true);
    });

    it('should handle errors when marking notifications as read', async () => {
      const invalidToken = jwt.sign(
        { _id: 'invalid-id' },
        process.env.SECRET || 'testsecret'
      );

      const response = await request(app)
        .post('/notifications/read')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Request is not authorized');
    });

    it('should handle database errors when marking notifications as read', async () => {
      // Force MongoDB error
      jest.spyOn(NotificationModel, 'updateMany').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/notifications/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error marking notifications as read');
    });
  });

  describe('DELETE /notifications/clear', () => {
    it('should clear all notifications', async () => {
      // Create test notifications
      await NotificationModel.create([
        {
          userId: testUser._id,
          type: 'task',
          message: 'Test notification',
          read: false
        }
      ]);

      const response = await request(app)
        .delete('/notifications/clear')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All notifications cleared');

      // Verify notifications are deleted
      const notifications = await NotificationModel.find({ userId: testUser._id });
      expect(notifications.length).toBe(0);
    });

    it('should handle errors when clearing notifications', async () => {
      const invalidToken = jwt.sign(
        { _id: 'invalid-id' },
        process.env.SECRET || 'testsecret'
      );

      const response = await request(app)
        .delete('/notifications/clear')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Request is not authorized');
    });
  });
});
