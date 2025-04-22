const express = require('express');

const {
  loginUser,
  createRegistration,
  refreshToken
} = require('../controllers/userController');

const router = express.Router();

// Route to handle user login
router.post('/login', loginUser);
// Route to handle user registration
router.post('/register', createRegistration);

router.post('/refresh', refreshToken);

module.exports = router;