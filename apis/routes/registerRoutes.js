const express = require('express');
const loginController = require('../controllers/loginController');

const router = express.Router();

// Controller to handle user login
router.post('/register', createRegistration);

module.exports = router;