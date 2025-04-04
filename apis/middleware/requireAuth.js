const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');


const requireAuth = async (req, res, next) => {

    // Check if the user is authenticated
   const {authorization} = req.headers;

    if (!authorization) {
        return res.status(401).json({error: 'Authorization token required'});
    }

    const token = authorization.split(' ')[1];

    // Verify the token
    try {
        const {_id} = jwt.verify(token, `${process.env.SECRET}`);
        req.user = await User.findOne({_id}).select('_id');
        next();
    } catch(err){
        return res.status(401).json({error: 'Rqequest is not authorized'});
    }
}

module.exports = requireAuth;