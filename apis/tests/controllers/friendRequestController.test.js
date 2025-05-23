const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../index');
const UserModel = require('../../models/UserModel');
const FriendRequestModel = require('../../models/FriendRequestModel');
const NotificationModel = require('../../models/NotificationModel');
const jwt = require('jsonwebtoken');

describe('Friend Request Controller', () => {
  let authToken;
  let user1;
  let user2;

  beforeEach(async () => {
    // Clear the database first
    await UserModel.deleteMany({});
    await FriendRequestModel.deleteMany({});
    await NotificationModel.deleteMany({});
    
    // Create test users with fresh IDs
    user1 = await UserModel.create({
      name: "Test User 1",
      email: `test1.${Date.now()}@test.com`,
      password: "Test123!"
    });
    
    user2 = await UserModel.create({
      name: "Test User 2", 
      email: `test2.${Date.now()}@test.com`,
      password: "Test123!"
    });
    
    // Create auth token for user1
    authToken = jwt.sign(
      { _id: user1._id },
      process.env.SECRET || 'testsecret'
    );
  });

  describe('POST /friends/request', () => {
    it('should send a friend request successfully', async () => {
      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: user2._id.toString() }); // Send _id as string

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Friend request sent successfully');

      // Verify friend request was created
      const friendRequest = await FriendRequestModel.findOne({
        from: user1._id,
        to: user2._id
      });
      expect(friendRequest).toBeTruthy();
    });

    it('should prevent duplicate friend requests', async () => {
      // Create existing friend request
      await FriendRequestModel.create({
        from: user1._id,
        to: user2._id,
        status: 'pending'
      });

      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: user2._id.toString() }); // Send _id as string

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Friend request already sent');
    });

    it('should prevent sending request to self', async () => {
      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: user1._id.toString() }); // Sending to self

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot send friend request to yourself');
    });

    it('should handle already friends case', async () => {
      // Add users as friends first
      await UserModel.findByIdAndUpdate(user1._id, {
        $push: { 
          friendsList: {
            userId: user2._id,
            email: user2.email
          }
        }
      });

      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: user2._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Users are already friends');
    });

    it('should handle non-existent target user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: fakeId.toString() });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Target user not found');
    });

    it('should handle server errors gracefully', async () => {
      // Force an error by passing invalid ID format
      const response = await request(app)
        .post('/friends/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ _id: 'invalid-id' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error sending friend request');
    });
  });

  describe('GET /friends/requests', () => {
    it('should fetch pending friend requests', async () => {
      // Create a pending friend request that user2 sent to user1
      await FriendRequestModel.create({
        from: user2._id,
        to: user1._id, // This user should receive the request
        status: 'pending'
      });

      const response = await request(app)
        .get('/friends/requests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      
      const friendRequest = response.body[0];
      expect(friendRequest.from).toBeTruthy();
      expect(friendRequest.to.toString()).toBe(user1._id.toString());
      expect(friendRequest.status).toBe('pending');
    });
  });

  describe('POST /friends/handle', () => {
    let friendRequest;

    beforeEach(async () => {
      friendRequest = await FriendRequestModel.create({
        from: user2._id,
        to: user1._id,
        status: 'pending'
      });
    });

    it('should handle missing request data', async () => {
      const response = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Request ID and action are required');
    });

    it('should handle invalid action', async () => {
      const response = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestId: friendRequest._id,
          action: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid action');
    });

    it('should handle non-existent request', async () => {
      const response = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestId: new mongoose.Types.ObjectId(),
          action: 'accept'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Request not found');
    });

    it('should accept friend request successfully', async () => {
      const response = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestId: friendRequest._id,
          action: 'accept'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Friend request accepted');

      // Verify users are now friends
      const updatedUser1 = await UserModel.findById(user1._id);
      const updatedUser2 = await UserModel.findById(user2._id);

      expect(updatedUser1.friendsList.some(f => f.userId.toString() === user2._id.toString())).toBe(true);
      expect(updatedUser2.friendsList.some(f => f.userId.toString() === user1._id.toString())).toBe(true);
    });

    it('should reject friend request successfully', async () => {
      const response = await request(app)
        .post('/friends/handle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestId: friendRequest._id,
          action: 'reject'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Friend request rejected');

      // Verify friend request status updated
      const updatedRequest = await FriendRequestModel.findById(friendRequest._id);
      expect(updatedRequest.status).toBe('rejected');
    });
  });

  describe('DELETE /friends/:friendId', () => {
    beforeEach(async () => {
      // Setup users as friends first
      await UserModel.findByIdAndUpdate(user1._id, {
        $push: { 
          friendsList: {
            userId: user2._id,
            email: user2.email
          }
        }
      });
      await UserModel.findByIdAndUpdate(user2._id, {
        $push: { 
          friendsList: {
            userId: user1._id,
            email: user1.email
          }
        }
      });
    });

    it('should successfully unfollow a friend', async () => {
      const response = await request(app)
        .delete(`/friends/${user2._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Friend removed successfully');

      // Verify both users' friendsLists are updated
      const updatedUser1 = await UserModel.findById(user1._id);
      const updatedUser2 = await UserModel.findById(user2._id);

      expect(updatedUser1.friendsList.length).toBe(0);
      expect(updatedUser2.friendsList.length).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const response = await request(app)
        .delete('/friends/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error removing friend');
    });
  });
});
