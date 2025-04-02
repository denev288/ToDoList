const express = require('express');
const registerController = require('../controllers/registerController');

const router = express.Router();

// Controller to handle user login
router.post('/login', loginUser);

module.exports = router;