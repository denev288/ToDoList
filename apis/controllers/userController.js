const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");  // Add this import
const NotificationModel = require("../models/NotificationModel");
const FriendRequestModel = require("../models/FriendRequestModel");
const validator = require("validator");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "10s" }); // access token
};
const createRefreshToken = (_id) => {
  return jwt.sign({ _id }, process.env.RREFRESH_TOKEN_SECRET, { expiresIn: "3d" }); // refresh token
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    await jwt.verify(
      refreshToken,
      process.env.RREFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Invalid or expired refresh token" });
        }

        const user = await UserModel.findById(decoded._id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const newAccessToken = createToken(user._id);

        res.status(200).json({ token: newAccessToken });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "refreshToken Method" });
  }
};

// Finds the user in the database and checks if the password is correct
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    res.status(200).json({ email, token, refreshToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createRegistration = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await UserModel.signup(name, email, password);
    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch notifications for the logged-in user
async function getNotifications(req, res) {
  try {
    const notifications = await NotificationModel.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Error marking notifications as read" });
  }
};

// Search for users
const searchUsers = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email parameter required" });
    }

    // Find target user
    const targetUser = await UserModel.findOne({ email }).select('name email');
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow sending request to self
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if they are already friends
    const currentUser = await UserModel.findById(req.user._id);
    if (currentUser.friendsList.includes(targetUser._id)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // Check for pending friend request
    const existingRequest = await FriendRequestModel.findOne({
      from: req.user._id,
      to: targetUser._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already pending" });
    }

    // If all checks pass, return the user
    res.status(200).json([targetUser]);

  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Error searching for users" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)
      .select('name email friendsList');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};

const updateUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user._id;

  try {
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    // Password handling
    if (password && password.trim() !== '') {
      if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "Password not strong enough" });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Check email uniqueness
    if (email) {
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const user = await UserModel.findById(userId);
    const oldEmail = user.email;

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('name email');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If email changed, update all friends' friendsList
    if (email && email !== oldEmail) {
      // Find all users who have this user as friend
      const usersToUpdate = await UserModel.find({
        'friendsList.userId': userId
      });

      // Update friend email in their lists and notify them
      const updatePromises = usersToUpdate.map(async (friendUser) => {
        // Update friend's list
        await UserModel.updateOne(
          { 
            _id: friendUser._id,
            'friendsList.userId': userId 
          },
          { 
            $set: { 'friendsList.$.email': email }
          }
        );

        // Create notification for the friend
        await NotificationModel.create({
          userId: friendUser._id,
          type: 'email_update',
          message: `${oldEmail} has changed their email to ${email}`,
          read: false
        });
      });

      await Promise.all(updatePromises);
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  createRegistration,
  refreshToken,
  getNotifications,
  markNotificationsAsRead,
  searchUsers,
  getCurrentUser,
  updateUser,
};
