const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  console.log("Authorization header received:", authorization);

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  console.log("Token received:", token);

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);

    const user = await User.findOne({ _id }).select('_id');
    if (!user) {
      return res.status(401).json({ error: 'User not found, unauthorized' });
    }

    req.user = user; // Attach the user to the request object
    next();
  } catch (err) {
    console.error("Error verifying token:", err.message);
    return res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;