const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");



const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};
// Finds the user in the database and checks if the password is correct
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await UserModel.login(email, password);
        //create token
        const token = createToken(user._id);
        
        res.status(200).json({email, token});
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

module.exports = {
    loginUser,
    createRegistration
};
