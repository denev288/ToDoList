const User = require("../models/UserModel");
const Todo = require("../models/Todo");

// Share task controller
async function shareTask(req, res) {
  const { taskId } = req.params;
  const { email, message } = req.body;

  try {
    // Find the task to be shared
    const task = await Todo.findById(taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if the recipient exists
    const recipient = await User.findOne({ email });
    if (!recipient) {
     
      console.error("Recipient not found:", email); return res.status(404).json({ error: "Recipient not found" });
    }

    // Create a new task for the recipient
    const sharedTask = new Todo({
      text: task.text,
      description: task.description,
      completed: false,
      user_id: recipient._id, // Assign the task to the recipient
      sharedBy: req.user.name, // Add information about who shared the task
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