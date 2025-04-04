const express = require("express");
const {
  getAllTasks,
  addTask,
  deleteTask,
  updateTaskCompletion,
  editTask,
} = require("../controllers/todoController");

const router = express.Router();

router.post("/add", addTask); // Add a new task
router.get("/tasks", getAllTasks); // Fetch all tasks
router.delete("/delete/:id", deleteTask); // Delete a task
router.patch("/update/:id", updateTaskCompletion); // Update task completion
router.patch("/edit/:id", editTask); // Edit task text

module.exports = router;