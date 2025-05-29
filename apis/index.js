const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const TodoModel = require("./models/Todo");
const todoRoutes = require("./routes/todoRoutes");
const userRoutes = require("./routes/userRoutes");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

dotenv.config();

// Connect to database using URL from environment
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost.second:5173",
    "https://681c9ab36e9225a2c9bcbff6--cozy-donut-e6055e.netlify.app",
    "https://cozy-donut-e6055e.netlify.app"

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

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(3004, () => {
    console.log("server is running on port 3004");
  });
}

module.exports = app;




