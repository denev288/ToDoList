const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const TodoModel = require("./models/Todo");
const todoRoutes = require("./routes/todoRoutes");
const userRoutes = require("./routes/userRoutes");
const dotenv = require("dotenv");

dotenv.config();

MONDODB_URL = process.env.MONDODB_URL;
Mongo_url = "mongodb://localhost:27017/todo"

mongoose.connect(MONDODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", userRoutes);
app.use("/", todoRoutes);

// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path}`);
//   next();
// });

app.listen(3004, () => {
  console.log("server is running on port 3004");
});





