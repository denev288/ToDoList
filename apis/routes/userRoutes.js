const express = require('express');

const {
  loginUser,
  createRegistration,
} = require('../controllers/userController');

const router = express.Router();

// Route to handle user login
router.post('/login', loginUser);
// Route to handle user registration
router.post('/register', createRegistration);


module.exports = router;