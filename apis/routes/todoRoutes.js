const express = require("express");
const {
  getAllTasks,
  addTask,
  deleteTask,
  updateTaskCompletion,
  editTask,
} = require("../controllers/todoController");

const router = express.Router();

router.get("/tasks", getAllTasks);
router.post("/tasks", addTask);
router.delete("/tasks/:id", deleteTask);
router.patch("/tasks/:id/completed", updateTaskCompletion);
router.patch("/tasks/:id", editTask);

module.exports = router;