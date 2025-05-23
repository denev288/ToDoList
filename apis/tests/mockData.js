const mongoose = require('mongoose');

const mockUsers = {
  user1: {
    _id: new mongoose.Types.ObjectId(),
    name: "Test User 1",
    email: "test1@test.com",
    password: "Test123!"
  },
  user2: {
    _id: new mongoose.Types.ObjectId(),
    name: "Test User 2",
    email: "test2@test.com",
    password: "Test123!"
  }
};

const mockFriendRequest = {
  from: mockUsers.user1._id,
  to: mockUsers.user2._id,
  status: 'pending'
};

module.exports = {
  mockUsers,
  mockFriendRequest
};
