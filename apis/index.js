const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const TodoModel = require("./models/Todo");

mongoose.connect("mongodb://localhost:27017/todo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/add", (req, res) => {
  const text = req.body.text; // Use 'text' instead of 'task'
  TodoModel.create({ text })
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json(err));
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await TodoModel.find();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.delete("/delete/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const result = await TodoModel.findByIdAndDelete(id); 
      if (result) {
        res.json();
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.patch("/update/:id", async (req, res) => {
    const id = req.params.id;
    const { completed } = req.body;
  
    try {
      const result = await TodoModel.findByIdAndUpdate(
        id,
        { completed },
        { new: true }
      );  
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    } catch (err) {
      console.error("Error updating task:", err);
      res.status(500).json({ error: "Failed to update task" });
    }
  });
  app.patch("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const { text } = req.body;
  
    try {
      const result = await TodoModel.findByIdAndUpdate(
        id,
        { text }
      );  
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    } catch (err) {
      console.error("Error updating task:", err);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

app.listen(3004, () => {
  console.log("server is running");
});
