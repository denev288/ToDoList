const User = require("../models/UserModel");
const Todo = require("../models/Todo");
const NotificationModel = require("../models/NotificationModel"); 

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
      sharedBy: sender.email,
      sharedWith: recipient.email,
      originalTaskId: task._id
    });

    // Update original task with recipient info
    task.sharedWith = recipient.email;
    await task.save();
    await sharedTask.save();

    // Create notification for the recipient
    try {
      const notificationMessage = req.body.message 
        ? `${sender.email} shared a task with you: "${task.text}". Message: ${req.body.message}`
        : `${sender.email} shared a task with you: "${task.text}"`;

      const notification = await NotificationModel.create({
        userId: recipient._id,
        type: 'task',
        message: notificationMessage,
        read: false,
        relatedId: sharedTask._id,
        senderEmail: sender.email
      });

    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
      // Continue execution even if notification fails
      // But log the error for debugging
    }

    res.status(200).json({ message: "Task shared successfully" });
  } catch (err) {
    console.error("Error sharing task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// handle task completion sync
async function syncTaskCompletion(taskId, completed, completedBy) {
  try {
    const task = await Todo.findById(taskId);
    if (!task) return;

    // If this is a shared task, update the original
    if (task.originalTaskId) {
      const originalTask = await Todo.findById(task.originalTaskId);
      if (originalTask) {
        originalTask.completed = completed;
        await originalTask.save();
      }
    }

    // If this is an original task, update all shared copies
    const sharedTasks = await Todo.find({ originalTaskId: taskId });
    for (const sharedTask of sharedTasks) {
      sharedTask.completed = completed;
      await sharedTask.save();
    }
  } catch (err) {
    console.error('Error syncing task completion:', err);
  }
}

module.exports = {
  shareTask,
  syncTaskCompletion
};