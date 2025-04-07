const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  user_id: {
    type: String,
    required: true
  }

});

const TodoModel = mongoose.model("Todo", TodoSchema);

module.exports = TodoModel;