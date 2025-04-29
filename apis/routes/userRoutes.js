const express = require('express');
const { loginUser, createRegistration, refreshToken, searchUsers } = require('../controllers/userController');
const { getNotifications, markNotificationsAsRead, clearNotifications } = require('../controllers/notificationController');
const { sendFriendRequest, getPendingRequests, handleFriendRequest } = require('../controllers/friendRequestController');
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', createRegistration);
router.post('/refresh', refreshToken);

// Protected routes
router.use(requireAuth);
router.post('/search', searchUsers);  // Changed from GET to POST
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsAsRead);
router.delete('/notifications/clear', clearNotifications);  // Add this line
router.post('/friends/request', sendFriendRequest);
router.get('/friends/requests', getPendingRequests);
router.post('/friends/handle', handleFriendRequest);

module.exports = router;