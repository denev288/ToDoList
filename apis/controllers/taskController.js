const User = require("../models/UserModel");
const Todo = require("../models/Todo");

// Share task controller
async function shareTask(req, res) {
  const { taskId } = req.params;
  const { email } = req.body;
  
  try {
    const sender = await User.findById(req.user._id);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    if (sender.email === email) {
      return res.status(400).json({ error: "Cannot share task with yourself" });
    }

    // Find the task to be shared
    const task = await Todo.findById(taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if the recipient exists
    const recipient = await User.findOne({ email });

    if (!recipient) {
      console.error("Recipient not found:", email); 
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Check if task already shared with this recipient
    const existingSharedTask = await Todo.findOne({
      text: task.text,
      user_id: recipient._id,
      sharedBy: sender.email
    });

    if (existingSharedTask) {
      return res.status(400).json({ error: "Task already shared with this recipient" });
    }

    // Create a new task for the recipient
    const sharedTask = new Todo({
      text: task.text,
      description: task.description,
      completed: false,
      user_id: recipient._id,
      sharedBy: sender.email, // Set the sender's email here
    });

    await sharedTask.save();

    res.status(200).json({ message: "Task shared successfully" });
  } catch (err) {
    console.error("Error sharing task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  shareTask,
};