const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  user_id: {
    type: String,
    required: true,
  },
  sharedBy: {
    type: String, 
    default: null, // Null if the task is owned by the user
  },
  sharedWith: {
    type: String,
    default: null,
  }
}, {
  timestamps: true,
});

const TodoModel = mongoose.model("Todo", TodoSchema);

module.exports = TodoModel;