const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../index");
const User = require("../../models/UserModel");
const Todo = require("../../models/Todo");
const jwt = require("jsonwebtoken");

// Mock auth middleware
jest.mock("../../middleware/requireAuth", () => {
  return (req, res, next) => {
    req.user = { _id: req.headers.testuser }; 
    next();
  };
});

jest.mock("../../models/UserModel");
jest.mock("../../models/Todo");

describe("Task Controller", () => {
  let testUser;
  let testTask;

  beforeEach(() => {
    jest.resetAllMocks();

    testUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "test@example.com",
      name: "Test User"
    };

    testTask = {
      _id: new mongoose.Types.ObjectId(),
      text: "Test task", 
      user_id: testUser._id,
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock User methods
    User.findById.mockResolvedValue(testUser);
    User.findOne.mockResolvedValue(testUser);
    
    // Mock Todo methods
    Todo.findById.mockResolvedValue(testTask);
    Todo.findOne.mockResolvedValue(null);
  });

  describe("POST /share/:taskId", () => {
    it("should share task successfully", async () => {
      const recipientUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "recipient@test.com"
      };

      User.findOne.mockResolvedValueOnce(recipientUser);

      const response = await request(app)
        .post(`/share/${testTask._id}`)
        .set("testuser", testUser._id.toString())
        .send({ email: "recipient@test.com" });

      expect(response.status).toBe(200);
    });

    it("should handle task not found", async () => {
      Todo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/share/${testTask._id}`)
        .set("testuser", testUser._id.toString())
        .send({ email: "recipient@test.com" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    it("should handle sender not found", async () => {
      User.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/share/${testTask._id}`)
        .set("testuser", testUser._id.toString())
        .send({ email: "recipient@test.com" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Sender not found");
    });
  });

  describe("syncTaskCompletion", () => {
    it("should sync completion status for shared task", async () => {
      const originalTask = {
        _id: new mongoose.Types.ObjectId(),
        completed: false,
        save: jest.fn(),
      };

      testTask.originalTaskId = originalTask._id;
      Todo.findById
        .mockResolvedValueOnce(testTask)
        .mockResolvedValueOnce(originalTask);

      const {
        syncTaskCompletion,
      } = require("../../controllers/taskController");
      await syncTaskCompletion(testTask._id, true);

      expect(originalTask.completed).toBe(true);
      expect(originalTask.save).toHaveBeenCalled();
    });

    it("should sync completion status for original task", async () => {
      const sharedTask = {
        completed: false,
        save: jest.fn(),
      };

      Todo.findById.mockResolvedValue(testTask);
      Todo.find.mockResolvedValue([sharedTask]);

      const {
        syncTaskCompletion,
      } = require("../../controllers/taskController");
      await syncTaskCompletion(testTask._id, true);

      expect(sharedTask.completed).toBe(true);
      expect(sharedTask.save).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      Todo.findById.mockRejectedValue(new Error("Database error"));

      const {
        syncTaskCompletion,
      } = require("../../controllers/taskController");
      await syncTaskCompletion("invalid-id", true);

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
