const express = require("express");
const {
  getAllTasks,
  addTask,
  deleteTask,
  updateTaskCompletion,
  editTask,
} = require("../controllers/todoController");
const { shareTask } = require("../controllers/taskController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth); // Protect all routes below this middleware

router.post("/add", addTask); // Add a new task

router.get("/tasks", getAllTasks); // Fetch all tasks

router.delete("/delete/:id", deleteTask); // Delete a task

router.patch("/update/:id", updateTaskCompletion); // Update task completion

router.patch("/edit/:id", editTask); // Edit task text

router.post("/share/:taskId", shareTask); // Share a task with another user

module.exports = router;