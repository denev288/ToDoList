const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const TodoModel = require("./models/Todo");
const todoRoutes = require("./routes/todoRoutes");
const userRoutes = require("./routes/userRoutes");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

dotenv.config();


MONDODB_URL = process.env.MONDODB_URL;
Mongo_url = "mongodb://localhost:27017/todo"

mongoose.connect(MONDODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost.second:5173",
    "https://681c9ab36e9225a2c9bcbff6--cozy-donut-e6055e.netlify.app/"

  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
};
app.use(cookieParser());
app.use(cors(corsOptions));

app.use(express.json());

app.use("/", userRoutes);
app.use("/", todoRoutes);

app.listen(3004, () => {
  console.log("server is running on port 3004");
});





