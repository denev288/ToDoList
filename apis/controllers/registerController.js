const RegisterModel = require("../models/Register");

const createRegistration = async (req, res) => {
    const { name, email, password } = req.body;
    RegisterModel.create(req.body)
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json(err));
   
  };

  module.exports = {
    createRegistration,
  };