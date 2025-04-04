const TodoModel = require("../models/Todo");

// Controller to fetch all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await TodoModel.find();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Controller to add a new task
const addTask = async (req, res) => {
  const { text } = req.body;
  try {
    const newTask = await TodoModel.create({ text, completed: false });
    res.status(201).json(newTask);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: "Failed to add task" });
  }
};

// Controller to delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTask = await TodoModel.findByIdAndDelete(id);
    if (deletedTask) {
      res.json(deletedTask);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Controller to update a task's completion status
const updateTaskCompletion = async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    const updatedTask = await TodoModel.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    );
    if (updatedTask) {
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
};

// Controller to edit a task's text
const editTask = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const updatedTask = await TodoModel.findByIdAndUpdate(
      id,
      { text },
      { new: true }
    );
    if (updatedTask) {
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (err) {
    console.error("Error editing task:", err);
    res.status(500).json({ error: "Failed to edit task" });
  }
};

module.exports = {
  getAllTasks,
  addTask,
  deleteTask,
  updateTaskCompletion,
  editTask,
};