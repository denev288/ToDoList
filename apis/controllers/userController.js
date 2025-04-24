const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "10s" }); // access token
};
const createRefreshToken = (_id) => {
    return jwt.sign({ _id }, process.env.RREFRESH_TOKEN_SECRET, { expiresIn: "3d" }); // refresh token
};

const refreshToken = async (req, res) => {
    
    try {
        const refreshToken = req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found' });
        }

        await jwt.verify(refreshToken, process.env.RREFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired refresh token' });
            }

            const user = await UserModel.findById(decoded._id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const newAccessToken = createToken(user._id);

            res.status(200).json({ token: newAccessToken });
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({  message: "refreshToken Method" });
    }
};

// Finds the user in the database and checks if the password is correct
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await UserModel.login(email, password);
        //create token
        const token = createToken(user._id);
        const refreshToken = createRefreshToken(user._id)
        
        
        // res.cookie('refreshToken', refreshToken, {
        //     httpOnly: true,   
        //     secure: process.env.RREFRESH_TOKEN_SECRET === 'production', 
        //     sameSite: 'Strict', 
        //     maxAge: 3 * 24 * 60 * 60 * 1000 
        // });

        res.status(200).json({email, token, refreshToken});
    } catch(error){
        res.status(400).json({message: error.message});
    }
};

const createRegistration = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await UserModel.signup(name, email, password);

        //create token
        const token = createToken(user._id);
        res.status(200).json({email, token});
    } catch(error){
        res.status(400).json({message: error.message});
    }
  };

// Fetch notifications for the logged-in user
async function getNotifications(req, res) {
  try {
    const user = await UserModel.findById(req.user._id).select("notifications");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user.notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
    loginUser,
    createRegistration, 
    refreshToken,
    getNotifications
};