const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../index");
const User = require("../../models/UserModel");
const FriendRequestModel = require("../../models/FriendRequestModel");
const NotificationModel = require("../../models/NotificationModel");
const jwt = require("jsonwebtoken");

jest.mock("../../models/UserModel");
jest.mock("../../models/FriendRequestModel");
jest.mock("../../models/NotificationModel");

// Mock auth middleware
jest.mock("../../middleware/requireAuth", () => {
  return (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not authenticated" });
    }
    req.user = { _id: req.headers.testuser };
    next();
  };
});

describe("User Controller", () => {
  let testUser;
  let validToken;

  beforeEach(() => {
    jest.resetAllMocks();
    testUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "test@example.com",
      name: "Test User",
      password: "hashedPassword123",
    };

    validToken = jwt.sign(
      { _id: testUser._id },
      process.env.SECRET || "testsecret"
    );
  });

  describe("POST /login", () => {
    it("should login with valid credentials", async () => {
      User.login.mockResolvedValue(testUser);

      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "ValidPass123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should handle missing credentials", async () => {
      User.login.mockRejectedValue(new Error("All fields must be filled"));

      const response = await request(app).post("/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields must be filled");
    });
  });

  describe("UserModel.login", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should throw error if email is missing", async () => {
      User.login.mockRejectedValue(new Error("All fields must be filled"));

      const response = await request(app)
        .post("/login")
        .send({ password: "ValidPass123!" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields must be filled");
    });

    it("should throw error if password is missing", async () => {
      User.login.mockRejectedValue(new Error("All fields must be filled"));

      const response = await request(app)
        .post("/login")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields must be filled");
    });

    it("should throw error for non-existent email", async () => {
      User.login.mockRejectedValue(new Error("Incorrect email"));

      const response = await request(app)
        .post("/login")
        .send({
          email: "nonexistent@example.com",
          password: "ValidPass123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Incorrect email");
    });

    it("should throw error for incorrect password", async () => {
      User.login.mockRejectedValue(new Error("Incorrect password"));

      const response = await request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "WrongPass123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Incorrect password");
    });
  });

  describe("POST /register", () => {
    it("should register new user successfully", async () => {
      User.signup.mockResolvedValue(testUser);

      const response = await request(app).post("/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "ValidPass123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should handle validation errors", async () => {
      User.signup.mockRejectedValue(new Error("Password not strong enough"));

      const response = await request(app).post("/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "weak",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password not strong enough");
    });

    it("should handle duplicate email registration", async () => {
      User.signup.mockRejectedValue(new Error("Email already in use"));

      const response = await request(app).post("/register").send({
        name: "Test User",
        email: "existing@example.com",
        password: "ValidPass123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email already in use");
    });

    it("should validate password strength", async () => {
      User.signup.mockRejectedValue(
        new Error("Password must be at least 8 characters long")
      );

      const response = await request(app).post("/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "weak",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Password must be at least 8 characters long"
      );
    });
  });

  describe("POST /refresh", () => {
    it("should refresh token successfully", async () => {
      const mockRefreshToken = jwt.sign(
        { _id: testUser._id },
        process.env.RREFRESH_TOKEN_SECRET || "test-refresh-secret",
        { expiresIn: "7d" }
      );

      User.findById.mockResolvedValue(testUser);

      const response = await request(app)
        .post("/refresh")
        .send({ refreshToken: mockRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should handle invalid refresh token", async () => {
      const response = await request(app)
        .post("/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid or expired refresh token");
    });
  });

  describe("POST /search", () => {
    beforeEach(() => {
      // Mock chaining for findOne().select()
      const mockSelectFn = jest.fn().mockReturnValue({
        _id: new mongoose.Types.ObjectId(),
        email: "test@example.com",
        name: "Test User",
      });

      User.findOne.mockReturnValue({
        select: mockSelectFn,
      });

      FriendRequestModel.findOne.mockResolvedValue(null);
    });

    it("should search users by email", async () => {
      const foundUserId = new mongoose.Types.ObjectId();
      const foundUser = {
        _id: foundUserId,
        email: "friend@example.com",
        name: "Friend",
      };

      // Mock findOne().select() chain
      const mockSelectFn = jest.fn().mockResolvedValue(foundUser);
      User.findOne.mockReturnValue({ select: mockSelectFn });

      User.findById.mockResolvedValue({
        _id: testUser._id,
        email: testUser.email,
        friendsList: [],
      });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ email: foundUser.email });

      console.log("Test response:", response.body);

      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject({
        email: foundUser.email,
        name: foundUser.name,
      });
    });

    it("should handle user not found", async () => {
      // Mock findOne().select() to return null
      const mockSelectFn = jest.fn().mockResolvedValue(null);
      User.findOne.mockReturnValue({ select: mockSelectFn });

      User.findById.mockResolvedValue({
        _id: testUser._id,
        email: testUser.email,
        friendsList: [],
      });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ email: "nonexistent@example.com" });

      console.log("Not found response:", response.body); // Debug log

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should handle already friends", async () => {
      const foundUserId = new mongoose.Types.ObjectId();
      const foundUser = {
        _id: foundUserId,
        email: "friend@example.com",
        name: "Friend",
      };

      // Mock findOne().select() chain correctly
      const mockSelectFn = jest.fn().mockResolvedValue(foundUser);
      User.findOne.mockReturnValue({ select: mockSelectFn });

      User.findById.mockResolvedValue({
        _id: testUser._id,
        email: testUser.email,
        friendsList: [foundUserId],
      });

      const response = await request(app)
        .post("/search")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ email: foundUser.email });

      console.log("Already friends response:", response.body);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("You are already friends with this user");
    });
  });

  describe("GET /notifications", () => {
    it("should fetch notifications successfully", async () => {
      const mockDate = new Date();
      const mockNotifications = [
        {
          userId: testUser._id.toString(),
          type: "test",
          message: "Test notification",
          read: false,
          createdAt: mockDate.toISOString(),
        },
      ];

      const mockSortFn = jest.fn().mockResolvedValue(mockNotifications);
      NotificationModel.find.mockReturnValue({ sort: mockSortFn });

      const response = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNotifications);
    });

    it("should handle errors when fetching notifications", async () => {
      const mockSortFn = jest.fn().mockRejectedValue(new Error("Database error"));
      NotificationModel.find.mockReturnValue({ sort: mockSortFn });

      const response = await request(app)
        .get("/notifications")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString());

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error fetching notifications"); // Updated error message
    });
  });

  describe("POST /notifications/read", () => {
    it("should mark notifications as read", async () => {
      NotificationModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const response = await request(app)
        .post("/notifications/read")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Notifications marked as read");
    });

    it("should handle errors when marking as read", async () => {
      NotificationModel.updateMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/notifications/read")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString());

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Error marking notifications as read");
    });
  });

  describe("GET /user", () => {
    it("should handle user not found", async () => {
      const mockSelectFn = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ select: mockSelectFn });

      const response = await request(app)
        .get("/user")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString());

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PATCH /user/update", () => {
    it("should handle email already in use", async () => {
      User.findOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

      const response = await request(app)
        .patch("/user/update")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ email: "existing@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email already in use");
    });

    it("should handle password update with weak password", async () => {
      const response = await request(app)
        .patch("/user/update")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ password: "weak" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password not strong enough");
    });

    it("should handle user not found during update", async () => {
      User.findById.mockResolvedValue(testUser);
      User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const response = await request(app)
        .patch("/user/update")
        .set("Authorization", `Bearer ${validToken}`)
        .set("testuser", testUser._id.toString())
        .send({ name: "New Name" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  });
});
