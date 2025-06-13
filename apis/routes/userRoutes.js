const express = require('express');
const { loginUser, createRegistration, refreshToken, searchUsers, getCurrentUser, updateUser, logClientError } = require('../controllers/userController');
const { getNotifications, markNotificationsAsRead, clearNotifications } = require('../controllers/notificationController');
const { sendFriendRequest, getPendingRequests, handleFriendRequest, unfollowFriend } = require('../controllers/friendRequestController');
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Public routes
router.post('/login', loginUser);
router.post('/register', createRegistration);
router.post('/refresh', refreshToken);
router.post('/log-error', logClientError); 

router.use(requireAuth); // All routes after this will require authentication

router.post('/search', searchUsers); 
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsAsRead);
router.delete('/notifications/clear', clearNotifications);
router.post('/friends/request', sendFriendRequest);
router.get('/friends/requests', getPendingRequests);
router.post('/friends/handle', handleFriendRequest);
router.delete('/friends/:friendId', unfollowFriend);
router.get('/user', getCurrentUser);
router.patch('/user/update', updateUser);

module.exports = router;