// Finds the user in the database and checks if the password is correct
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    RegisterModel.findOne({ email: email })
    .then((result) => {
        if (result) {
            if (result.password === password) {
                res.json("Success");
            } else {
                res.status(401).json({ message: "Invalid password" });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    });
};

module.exports = {
    loginUser,
};
